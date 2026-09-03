/* ================================================================
   Tab Out — Unified Search Module

   Provides unified search across tabs, bookmarks, and history
   with relevance scoring, recency weighting, and visit frequency.

   Features:
   - Fuse.js powered fuzzy search with typo tolerance
   - Relevance scoring (tabs > bookmarks > history)
   - Recency weighting (recent items scored higher)
   - Visit frequency weighting (frequently visited scored higher)
   - Match highlighting
   - Configurable result limit (default 10)
   - Debounce support for live search
   ================================================================ */

'use strict';

import { SEARCH_CONFIG, SCORE_WEIGHTS, STOP_WORDS } from './constants.js';

// Fuse.js is loaded globally via script tag in overlay.html
// eslint-disable-next-line no-undef
const FuseLib = typeof Fuse !== 'undefined' ? Fuse : null;

// Fuse.js configuration options (using constants)
const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'url', weight: 0.3 }
  ],
  threshold: SEARCH_CONFIG.fuseThreshold,
  distance: SEARCH_CONFIG.fuseDistance,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: SEARCH_CONFIG.fuseMinMatchLength,
  useExtendedSearch: true,
  findAllMatches: true
};

// User pins storage key
const USER_PINS_STORAGE_KEY = 'userPinnedUrls';

// Validation constants
const MAX_CUSTOM_NAME_LENGTH = 200;

/* ================================================================
   SECURITY: Input Validation

   All user-provided data is validated before storage:
   - URLs: Must be valid http/https/file protocol (isValidUrl)
   - Custom names: Truncated to MAX_CUSTOM_NAME_LENGTH chars
   - Loaded data: Malformed entries are filtered out (isValidPin)

   ERROR HANDLING PATTERN:
   - All async functions use try/catch
   - Errors logged with [Search] prefix for traceability
   - Functions return safe defaults on failure ([] or false)
   - No user-facing error messages (silent degradation)
   ================================================================ */

/**
 * Validate if a string is a valid URL
 * SECURITY: Only allows http, https, and file protocols
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    // Only allow http, https, and file protocols
    return ['http:', 'https:', 'file:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate a pin object has required fields
 * @param {object} pin - Pin object to validate
 * @returns {boolean} True if valid
 */
function isValidPin(pin) {
  return pin &&
    typeof pin === 'object' &&
    typeof pin.url === 'string' &&
    pin.url.length > 0 &&
    isValidUrl(pin.url);
}

/**
 * Load user-pinned URLs from Chrome storage
 * Filters out malformed entries for data integrity
 * @returns {Promise<Array>} Array of valid user pin objects
 */
export async function loadUserPins() {
  try {
    const result = await chrome.storage.local.get(USER_PINS_STORAGE_KEY);
    const stored = result[USER_PINS_STORAGE_KEY];

    // Validate stored data is an array
    if (!Array.isArray(stored)) {
      console.warn('[Search] User pins data is not an array, returning empty');
      return [];
    }

    // Filter out malformed entries
    const validPins = stored.filter(pin => {
      if (!isValidPin(pin)) {
        console.warn('[Search] Filtered out malformed pin:', pin);
        return false;
      }
      return true;
    });

    return validPins;
  } catch (error) {
    console.error('[Search] Failed to load user pins:', error);
    return [];
  }
}

/**
 * Save user-pinned URLs to Chrome storage
 * @param {Array} pins - Array of user pin objects
 */
export async function saveUserPins(pins) {
  try {
    await chrome.storage.local.set({ [USER_PINS_STORAGE_KEY]: pins });
  } catch (error) {
    console.error('[Search] Failed to save user pins:', error);
  }
}

/**
 * Add a URL to user pins
 * @param {string} url - URL to pin (must be valid http/https/file URL)
 * @param {string} title - Title for the pin
 * @returns {Promise<boolean>} Success status
 */
export async function addUserPin(url, title) {
  try {
    // Validate URL before storing
    if (!isValidUrl(url)) {
      console.error('[Search] Invalid URL, cannot pin:', url);
      return false;
    }

    const pins = await loadUserPins();

    // Check if already pinned
    if (pins.some(p => p.url === url)) {
      return false;
    }

    const keywords = generateKeywords(url, title);
    pins.push({
      url,
      title: title || '',
      keywords,
      pinnedAt: Date.now()
    });

    await saveUserPins(pins);
    return true;
  } catch (error) {
    console.error('[Search] Failed to add user pin:', error);
    return false;
  }
}

/**
 * Remove a URL from user pins
 * @param {string} url - URL to unpin
 * @returns {Promise<boolean>} Success status
 */
export async function removeUserPin(url) {
  try {
    const pins = await loadUserPins();
    const filteredPins = pins.filter(p => p.url !== url);

    if (filteredPins.length === pins.length) {
      return false; // URL was not pinned
    }

    await saveUserPins(filteredPins);
    return true;
  } catch (error) {
    console.error('[Search] Failed to remove user pin:', error);
    return false;
  }
}

/**
 * Update a user pin's custom name
 * @param {string} url - URL of the pin to update
 * @param {string} customName - New custom name for the pin (max 200 chars)
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserPinName(url, customName) {
  try {
    const pins = await loadUserPins();
    const pin = pins.find(p => p.url === url);

    if (!pin) {
      return false; // URL not found
    }

    // Truncate custom name to max length for security
    let sanitizedName = customName || '';
    if (sanitizedName.length > MAX_CUSTOM_NAME_LENGTH) {
      sanitizedName = sanitizedName.substring(0, MAX_CUSTOM_NAME_LENGTH);
      console.warn('[Search] Custom name truncated to', MAX_CUSTOM_NAME_LENGTH, 'chars');
    }

    // Update custom name and regenerate keywords
    pin.customName = sanitizedName;
    pin.keywords = generateKeywords(url, pin.title, sanitizedName);

    await saveUserPins(pins);
    return true;
  } catch (error) {
    console.error('[Search] Failed to update user pin name:', error);
    return false;
  }
}

/**
 * Check if a URL is user-pinned
 * @param {string} url - URL to check
 * @param {Array} userPins - Cached user pins array (optional)
 * @returns {boolean}
 */
export function isUserPinned(url, userPins = null) {
  if (!userPins) return false;
  return userPins.some(p => p.url === url);
}

/**
 * Generate keywords from URL, title, and optional custom name
 * Extracts hostname segments and pathname segments
 * @param {string} url - URL to extract keywords from
 * @param {string} title - Title to extract keywords from
 * @param {string} customName - Optional custom name to extract keywords from
 * @returns {Array<string>} Array of lowercase keywords
 */
export function generateKeywords(url, title, customName = '') {
  const keywords = new Set();

  try {
    const parsed = new URL(url);

    // Extract hostname segments (e.g., "dashboard.example.com" → ["dashboard", "example"])
    const hostParts = parsed.hostname.split('.');
    for (const part of hostParts) {
      if (part.length >= 2 && !STOP_WORDS.url.includes(part.toLowerCase())) {
        keywords.add(part.toLowerCase());
      }
    }

    // Extract pathname segments (e.g., "/user/repo/issues" → ["user", "repo", "issues"])
    const pathParts = parsed.pathname.split('/').filter(p => p.length >= 2);
    for (const part of pathParts) {
      // Skip common generic segments
      if (!STOP_WORDS.url.includes(part.toLowerCase())) {
        keywords.add(part.toLowerCase());
      }
    }
  } catch {
    // Invalid URL, skip URL-based keywords
  }

  // Extract words from title (2+ chars)
  if (title) {
    const titleWords = title.toLowerCase().split(/[\s\-_/|]+/).filter(w => w.length >= 2);
    for (const word of titleWords) {
      // Skip common words
      if (!STOP_WORDS.title.includes(word)) {
        keywords.add(word);
      }
    }
  }

  // Extract words from custom name (2+ chars) - highest priority for searching
  if (customName) {
    const customWords = customName.toLowerCase().split(/[\s\-_/|]+/).filter(w => w.length >= 2);
    for (const word of customWords) {
      keywords.add(word);
    }
  }

  return Array.from(keywords);
}

export class UnifiedSearch {
  constructor(tabs, bookmarks, options = {}) {
    this.tabs = tabs || [];
    this.bookmarks = bookmarks || [];
    this.maxResults = options.maxResults || 10;
    this.maxHistoryDays = options.maxHistoryDays || SEARCH_CONFIG.maxHistoryDays;
    this.userPins = []; // Will be loaded asynchronously
    this._userPinsLoaded = false;

    // Initialize Fuse.js instances for each data source
    this._initFuseInstances();
  }

  /**
   * Initialize Fuse.js search instances for tabs, bookmarks, and pins
   */
  _initFuseInstances() {
    if (!FuseLib) {
      console.warn('Fuse.js not loaded, falling back to basic search');
      return;
    }

    // Create Fuse instance for tabs
    this.fuseTabs = new FuseLib(this.tabs.map(t => ({
      title: t.title || '',
      url: t.url || '',
      _original: t
    })), FUSE_OPTIONS);

    // Create Fuse instance for bookmarks
    const bookmarkItems = this.bookmarks.filter(b => b.type === 'bookmark');
    this.fuseBookmarks = new FuseLib(bookmarkItems.map(b => ({
      title: b.title || '',
      url: b.url || '',
      _original: b
    })), FUSE_OPTIONS);
  }

  /**
   * Reinitialize Fuse instances when data changes
   */
  _reinitFuse() {
    this._initFuseInstances();
    this._initFusePins();
  }

  /**
   * Initialize Fuse.js instance for user pins
   */
  _initFusePins() {
    if (!FuseLib || !this.userPins.length) {
      this.fusePins = null;
      return;
    }

    // Pins have custom names and keywords that should also be searchable
    this.fusePins = new FuseLib(this.userPins.map(p => ({
      title: p.customName || p.title || '',
      originalTitle: p.title || '',
      url: p.url || '',
      customName: p.customName || '',
      keywords: (p.keywords || []).join(' '),
      _original: p
    })), {
      ...FUSE_OPTIONS,
      keys: [
        { name: 'customName', weight: 0.5 },  // Custom name highest priority
        { name: 'title', weight: 0.3 },
        { name: 'keywords', weight: 0.15 },
        { name: 'url', weight: 0.05 }
      ]
    });
  }

  /**
   * Initialize user pins from storage
   * Call this before the first search
   */
  async initUserPins() {
    if (!this._userPinsLoaded) {
      this.userPins = await loadUserPins();
      this._userPinsLoaded = true;
      this._initFusePins();
    }
  }

  /**
   * Reload user pins from storage (call after pin/unpin)
   */
  async reloadUserPins() {
    this.userPins = await loadUserPins();
    this._userPinsLoaded = true;
    this._initFusePins();
  }

  /**
   * search(query)
   * Searches across tabs, bookmarks, and history using Fuse.js fuzzy search
   * Returns sorted results with relevance scoring
   */
  async search(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase().trim();
    const results = [];
    const now = Date.now();

    // Check for user-pinned URLs (highest priority) using Fuse.js
    const userPinnedResults = this._getUserPinnedResults(queryLower);
    if (userPinnedResults.length > 0) {
      results.push(...userPinnedResults);
    }

    // Use Fuse.js for fuzzy search if available
    if (FuseLib && this.fuseTabs && this.fuseBookmarks) {
      // Search tabs with Fuse.js
      const tabResults = this.fuseTabs.search(query);
      for (const result of tabResults) {
        const tab = result.item._original;
        // Convert Fuse score (0-1, lower is better) to our score (higher is better)
        // Fuse score 0 = perfect match, 1 = no match
        const fuseScore = (1 - result.score) * 100;
        const typeBoost = SCORE_WEIGHTS.tab; // Tabs highest priority
        const finalScore = fuseScore * typeBoost;

        results.push({
          type: 'tab',
          title: tab.title,
          url: tab.url,
          tabId: tab.id,
          groupId: tab.groupId,
          score: finalScore,
        });
      }

      // Search bookmarks with Fuse.js
      const bookmarkResults = this.fuseBookmarks.search(query);
      for (const result of bookmarkResults) {
        const bookmark = result.item._original;
        const fuseScore = (1 - result.score) * 100;
        const typeBoost = SCORE_WEIGHTS.bookmark; // Bookmarks medium priority
        const finalScore = fuseScore * typeBoost;

        results.push({
          type: 'bookmark',
          title: bookmark.title,
          url: bookmark.url,
          bookmarkId: bookmark.id,
          parentTitle: bookmark.parentTitle || 'Bookmarks',
          score: finalScore,
        });
      }
    } else {
      // Fallback to original scoring if Fuse.js not available
      for (const tab of this.tabs) {
        const score = this._scoreItem(tab.title, tab.url, queryLower, 'tab', now, null);
        if (score > 0) {
          results.push({
            type: 'tab',
            title: tab.title,
            url: tab.url,
            tabId: tab.id,
            groupId: tab.groupId,
            score: score,
          });
        }
      }

      for (const bookmark of this.bookmarks) {
        if (bookmark.type !== 'bookmark') continue;
        const score = this._scoreItem(bookmark.title, bookmark.url, queryLower, 'bookmark', now, null);
        if (score > 0) {
          results.push({
            type: 'bookmark',
            title: bookmark.title,
            url: bookmark.url,
            bookmarkId: bookmark.id,
            parentTitle: bookmark.parentTitle || 'Bookmarks',
            score: score,
          });
        }
      }
    }

    // Search history (use original scoring + recency/frequency weights)
    const historyItems = await this._searchHistory(queryLower);
    for (const item of historyItems) {
      const score = this._scoreItem(
        item.title,
        item.url,
        queryLower,
        'history',
        now,
        { lastVisitTime: item.lastVisitTime, visitCount: item.visitCount }
      );
      if (score > 0) {
        results.push({
          type: 'history',
          title: item.title || item.url,
          url: item.url,
          lastVisitTime: item.lastVisitTime,
          visitCount: item.visitCount,
          score: score,
        });
      }
    }

    // Remove duplicates (prefer tabs > bookmarks > history)
    const uniqueResults = this._deduplicateResults(results);

    // Sort by score (descending)
    uniqueResults.sort((a, b) => b.score - a.score);

    // Group results by URL prefix
    const groupedResults = this._groupResults(uniqueResults);

    // Limit total results
    return this._limitGroupedResults(groupedResults, this.maxResults);
  }

  /**
   * _getUserPinnedResults(query)
   * Returns user-pinned URLs that match the query using Fuse.js
   * User pins score 9000+ (always appear at top in dedicated Pinned group)
   * Custom names get highest priority in matching
   */
  _getUserPinnedResults(query) {
    const results = [];

    // Use Fuse.js for pin matching if available
    if (FuseLib && this.fusePins) {
      const fuseResults = this.fusePins.search(query);
      for (const result of fuseResults) {
        const pin = result.item._original;
        // Convert Fuse score to our score system
        // Fuse score 0 = perfect match -> 10000 points
        // Fuse score 1 = no match -> 9000 points
        const fuseScore = (1 - result.score);
        const baseScore = 9000 + fuseScore * 1000; // Range: 9000-10000

        results.push({
          type: 'pinned',
          title: pin.customName || pin.title,
          originalTitle: pin.title,
          customName: pin.customName || '',
          url: pin.url,
          score: baseScore,
          isPinned: true,
        });
      }
      return results;
    }

    // Fallback to original matching logic if Fuse.js not available
    for (const pin of this.userPins) {
      let matchScore = 0;

      // Check custom name first (highest priority)
      const customNameLower = (pin.customName || '').toLowerCase();
      if (customNameLower) {
        if (customNameLower === query) {
          // Exact match on custom name - highest score
          matchScore = Math.max(matchScore, 10000);
        } else if (customNameLower.startsWith(query)) {
          // Custom name starts with query
          const matchRatio = query.length / customNameLower.length;
          matchScore = Math.max(matchScore, 9600 + matchRatio * 300); // 9600-9900 range
        } else if (customNameLower.includes(query)) {
          // Custom name contains query
          matchScore = Math.max(matchScore, 9500);
        }
      }

      // Check if any keyword matches the query
      for (const keyword of pin.keywords) {
        if (keyword === query) {
          // Exact match
          matchScore = Math.max(matchScore, 9400);
        } else if (keyword.startsWith(query)) {
          // Prefix match
          const matchRatio = query.length / keyword.length;
          const score = 9000 + matchRatio * 300; // 9000-9300 range
          matchScore = Math.max(matchScore, score);
        } else if (query.includes(keyword)) {
          // Query contains keyword
          matchScore = Math.max(matchScore, 8500);
        }
      }

      // Also check title and URL directly for fuzzy matching
      const titleLower = (pin.title || '').toLowerCase();
      const urlLower = (pin.url || '').toLowerCase();

      if (titleLower.includes(query) || urlLower.includes(query)) {
        matchScore = Math.max(matchScore, 9100);
      }

      if (matchScore > 0) {
        results.push({
          type: 'pinned',
          // Use custom name as display title if set, otherwise use original title
          title: pin.customName || pin.title,
          originalTitle: pin.title,
          customName: pin.customName || '',
          url: pin.url,
          score: matchScore,
          isPinned: true,
        });
      }
    }

    return results;
  }

  /**
   * _groupResults(results)
   * Groups results by common URL prefix (same domain + path prefix)
   * Returns array of groups, each with mainUrl and items sorted by score
   *
   * Special handling: Pinned items appear in a dedicated "Pinned" group at the top,
   * AND also appear in their regular domain groups below.
   */
  _groupResults(results) {
    const groups = [];
    const groupMap = new Map(); // baseUrl -> group

    // Collect all pinned items for the dedicated pinned group
    const pinnedItems = results.filter(r => r.isPinned || r.type === 'pinned');
    const pinnedUrls = new Set(pinnedItems.map(r => r.url));

    // Create a dedicated "Pinned" group if there are pinned items
    if (pinnedItems.length > 0) {
      const pinnedGroup = {
        baseUrl: '__pinned__',
        mainUrl: null,
        items: [...pinnedItems].sort((a, b) => b.score - a.score),
        totalScore: pinnedItems.reduce((sum, r) => sum + r.score, 0),
        maxScore: Math.max(...pinnedItems.map(r => r.score)),
        isPinnedGroup: true, // Special flag for rendering
      };
      groups.push(pinnedGroup);
    }

    // Group non-pinned results by their domain
    // Pinned items are already shown in the dedicated pinned group, so skip them here
    for (const result of results) {
      // Skip pinned items - they're already in the pinned group
      if (pinnedUrls.has(result.url)) {
        continue;
      }

      const baseUrl = this._extractBaseUrl(result.url);

      if (!groupMap.has(baseUrl)) {
        // Create new group
        const group = {
          baseUrl: baseUrl,
          mainUrl: this._getMainPageUrl(result.url),
          items: [result],
          totalScore: result.score,
          maxScore: result.score, // Track highest score for sorting
        };
        groupMap.set(baseUrl, group);
        groups.push(group);
      } else {
        // Add to existing group
        const group = groupMap.get(baseUrl);
        group.items.push(result);
        group.totalScore += result.score;
        group.maxScore = Math.max(group.maxScore, result.score);
      }
    }

    // Sort items within each group by score (most relevant first)
    for (const group of groups) {
      if (!group.isPinnedGroup) {
        group.items.sort((a, b) => b.score - a.score);
      }
    }

    // Sort groups by max score, but keep pinned group at the top
    groups.sort((a, b) => {
      // Pinned group always first
      if (a.isPinnedGroup) return -1;
      if (b.isPinnedGroup) return 1;
      return b.maxScore - a.maxScore;
    });

    return groups;
  }

  /**
   * _extractBaseUrl(url)
   * Extracts the base URL for grouping similar pages
   * Special handling for wikis, GitHub, Gardener, etc.
   */
  _extractBaseUrl(url) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(p => p.length > 0);

      // Gardener Dashboard pattern: /namespace/<namespace>/shoots/...
      // Group by environment and namespace
      if (parsed.hostname.includes('dashboard.garden.')) {
        let environment = null;
        if (parsed.hostname.includes('.canary.')) {
          environment = 'canary';
        } else if (parsed.hostname.includes('.live.')) {
          environment = 'live';
        }

        if (environment && pathParts[0] === 'namespace' && pathParts[1]) {
          const namespace = pathParts[1];
          return `garden-${environment}:${namespace}`;
        }
      }

      // Wiki/Confluence pattern: only match /wiki/spaces/SPACE/pages/...
      // Group all pages in the same space together
      if (pathParts.length >= 2 &&
          pathParts[0] === 'wiki' &&
          pathParts[1] === 'spaces' &&
          pathParts[2]) {
        const spaceId = pathParts[2];
        // Use a consistent format: wiki:[SPACE_ID]
        return `wiki:${spaceId}`;
      }

      // GitHub pattern: /org/repo
      if (parsed.hostname.includes('github')) {
        const basePath = pathParts.slice(0, 2).join('/');
        return `${parsed.protocol}//${parsed.hostname}${basePath ? '/' + basePath : ''}`;
      }

      // Jira pattern: group by project
      if (parsed.pathname.includes('/browse/')) {
        // Pattern: /browse/PROJECT-123 -> group by PROJECT
        const browseIndex = pathParts.indexOf('browse');
        if (browseIndex >= 0 && pathParts[browseIndex + 1]) {
          const issueKey = pathParts[browseIndex + 1];
          const project = issueKey.split('-')[0]; // Extract PROJECT from PROJECT-123
          return `jira:${project}`;
        }
      }

      // Default: protocol + domain + first 2 path segments
      const basePath = pathParts.slice(0, 2).join('/');
      return `${parsed.protocol}//${parsed.hostname}${basePath ? '/' + basePath : ''}`;
    } catch {
      return url;
    }
  }

  /**
   * _getMainPageUrl(url)
   * Gets the main page URL for a group
   */
  _getMainPageUrl(url) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(p => p.length > 0);

      // Wiki: link to space home
      if (pathParts.length >= 2 &&
          pathParts[0] === 'wiki' &&
          pathParts[1] === 'spaces' &&
          pathParts[2]) {
        const spaceId = pathParts[2];
        return `${parsed.protocol}//${parsed.hostname}/wiki/spaces/${spaceId}`;
      }

      // GitHub: link to repo
      if (parsed.hostname.includes('github')) {
        const mainPath = pathParts.slice(0, 2).join('/');
        return `${parsed.protocol}//${parsed.hostname}${mainPath ? '/' + mainPath : ''}`;
      }

      // Jira: link to project
      if (parsed.pathname.includes('/browse/')) {
        const browseIndex = pathParts.indexOf('browse');
        if (browseIndex >= 0 && pathParts[browseIndex + 1]) {
          const issueKey = pathParts[browseIndex + 1];
          const project = issueKey.split('-')[0];
          return `${parsed.protocol}//${parsed.hostname}/browse/${project}`;
        }
      }

      // Default
      const mainPath = pathParts.slice(0, 2).join('/');
      return `${parsed.protocol}//${parsed.hostname}${mainPath ? '/' + mainPath : ''}`;
    } catch {
      return url;
    }
  }

  /**
   * _limitGroupedResults(groups, maxResults)
   * Limits the total number of items across all groups
   */
  _limitGroupedResults(groups, maxResults) {
    const limitedGroups = [];
    let itemCount = 0;

    for (const group of groups) {
      if (itemCount >= maxResults) break;

      const remainingSlots = maxResults - itemCount;
      const limitedItems = group.items.slice(0, remainingSlots);

      if (limitedItems.length > 0) {
        limitedGroups.push({
          ...group,
          items: limitedItems,
        });
        itemCount += limitedItems.length;
      }
    }

    return limitedGroups;
  }

  /**
   * _searchHistory(query)
   * Searches Chrome history
   */
  async _searchHistory(query) {
    try {
      const startTime = Date.now() - (this.maxHistoryDays * 24 * 60 * 60 * 1000);
      const historyItems = await chrome.history.search({
        text: query,
        startTime: startTime,
        maxResults: SEARCH_CONFIG.maxHistoryResults,
      });
      return historyItems;
    } catch (error) {
      console.error('[Search] _searchHistory failed:', error);
      return [];
    }
  }

  /**
   * _deduplicateResults(results)
   * Removes duplicate URLs, keeping the highest priority type
   * Priority: tab > bookmark > history
   */
  _deduplicateResults(results) {
    const urlMap = new Map();
    const typePriority = { tab: 3, bookmark: 2, history: 1 };

    for (const result of results) {
      const existing = urlMap.get(result.url);
      if (!existing || typePriority[result.type] > typePriority[existing.type]) {
        urlMap.set(result.url, result);
      }
    }

    return Array.from(urlMap.values());
  }

  /**
   * _scoreItem(title, url, query, itemType, now, metadata)
   * Scores an item based on how well it matches the query
   * Supports multi-keyword search (e.g., "garden poc" matches items containing both words)
   * Returns 0 if no match
   *
   * @param {object} metadata - { lastVisitTime, visitCount } for history items
   */
  _scoreItem(title, url, query, itemType, now, metadata) {
    const titleLower = (title || '').toLowerCase();
    const urlLower = (url || '').toLowerCase();

    let score = 0;

    // Extract hostname from URL for domain matching
    let hostname = '';
    try {
      hostname = new URL(url).hostname.toLowerCase();
    } catch {}

    // Split query into keywords (words 2+ chars long)
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length >= 2);

    // If single word, use original exact/prefix/contains logic
    if (keywords.length === 1) {
      const q = keywords[0];

      // Title matching (most important)
      if (titleLower === q) {
        score += 100; // Exact match
      } else if (titleLower.startsWith(q)) {
        score += 80; // Starts with
      } else if (titleLower.includes(q)) {
        score += 50; // Contains
      } else if (this._fuzzyMatch(titleLower, q)) {
        score += 30; // Fuzzy match
      }

      // URL/hostname matching (less important)
      if (hostname.includes(q)) {
        score += 60; // Domain match
      } else if (urlLower.includes(q)) {
        score += 40; // URL contains
      }
    } else {
      // Multi-keyword search: ALL keywords must match
      let titleMatches = 0;
      let urlMatches = 0;
      let allKeywordsFound = true;

      for (const keyword of keywords) {
        const inTitle = titleLower.includes(keyword);
        const inUrl = urlLower.includes(keyword);
        const inHostname = hostname.includes(keyword);

        // If keyword not found anywhere, item doesn't match
        if (!inTitle && !inUrl && !inHostname) {
          allKeywordsFound = false;
          break;
        }

        // Count matches
        if (inTitle) titleMatches++;
        if (inUrl || inHostname) urlMatches++;
      }

      // If not all keywords found, return 0 (no match)
      if (!allKeywordsFound) {
        return 0;
      }

      // Score based on how many keywords matched in title vs URL
      // Title matches are more valuable
      score += titleMatches * 40; // 40 points per keyword in title
      score += urlMatches * 20;   // 20 points per keyword in URL

      // Bonus if all keywords found in title
      if (titleMatches === keywords.length) {
        score += 30;
      }

      // Bonus for keyword order preservation (e.g., "github power" matches better than "power github")
      if (this._matchesKeywordOrder(titleLower, keywords)) {
        score += 20;
      }
    }

    // If no match at all, return 0
    if (score === 0) return 0;

    // Type-based boost
    if (itemType === 'tab') {
      score *= 2.0; // Tabs are most relevant (currently open)
    } else if (itemType === 'bookmark') {
      score *= 1.3; // Bookmarks are saved for a reason
    } else if (itemType === 'history') {
      score *= 0.8; // History is less relevant
    }

    // Recency weighting (for history items)
    if (itemType === 'history' && metadata && metadata.lastVisitTime) {
      const ageInDays = (now - metadata.lastVisitTime) / (1000 * 60 * 60 * 24);

      // Recency boost: exponential decay
      // Items visited today get 1.5x boost, yesterday 1.3x, last week 1.1x, etc.
      if (ageInDays < 1) {
        score *= 1.5; // Today
      } else if (ageInDays < 7) {
        score *= 1.3; // This week
      } else if (ageInDays < 30) {
        score *= 1.1; // This month
      }
      // Older than 30 days: no boost
    }

    // Visit frequency weighting (for history items)
    if (itemType === 'history' && metadata && metadata.visitCount) {
      // Frequency boost: logarithmic scale
      // 1 visit: 1.0x, 5 visits: 1.2x, 10 visits: 1.3x, 50 visits: 1.5x, 100+ visits: 1.6x
      const frequencyBoost = 1 + Math.log10(metadata.visitCount + 1) * 0.3;
      score *= Math.min(frequencyBoost, 1.6); // Cap at 1.6x
    }

    return score;
  }

  /**
   * _fuzzyMatch(text, query)
   * Simple fuzzy matching - checks if all query characters appear in order
   */
  _fuzzyMatch(text, query) {
    let textIndex = 0;
    for (const char of query) {
      textIndex = text.indexOf(char, textIndex);
      if (textIndex === -1) return false;
      textIndex++;
    }
    return true;
  }

  /**
   * _matchesKeywordOrder(text, keywords)
   * Checks if keywords appear in the given order in text
   * Example: text="github powerlevel10k", keywords=["github", "power"] → true
   * Example: text="powerlevel10k on github", keywords=["github", "power"] → false
   */
  _matchesKeywordOrder(text, keywords) {
    let lastIndex = -1;
    for (const keyword of keywords) {
      const index = text.indexOf(keyword, lastIndex + 1);
      if (index === -1 || index <= lastIndex) {
        return false;
      }
      lastIndex = index;
    }
    return true;
  }

  /**
   * highlightMatch(text, query)
   * Highlights matching portions of text
   * Supports multi-keyword highlighting
   * Returns HTML string with <mark> tags
   */
  highlightMatch(text, query) {
    if (!text || !query) return text || '';

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // Try exact match first
    const exactIndex = textLower.indexOf(queryLower);
    if (exactIndex !== -1) {
      const before = text.slice(0, exactIndex);
      const match = text.slice(exactIndex, exactIndex + query.length);
      const after = text.slice(exactIndex + query.length);
      return `${this._escapeHtml(before)}<mark>${this._escapeHtml(match)}</mark>${this._escapeHtml(after)}`;
    }

    // Multi-keyword highlighting: highlight all matching keywords
    const keywords = query.split(/\s+/).filter(w => w.length >= 2);

    // Find all keyword positions
    const matches = [];
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      let searchPos = 0;
      while (true) {
        const idx = textLower.indexOf(keywordLower, searchPos);
        if (idx === -1) break;
        matches.push({ start: idx, end: idx + keyword.length, keyword });
        searchPos = idx + 1;
      }
    }

    // If no matches, return escaped text
    if (matches.length === 0) {
      return this._escapeHtml(text);
    }

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Merge overlapping matches
    const merged = [];
    for (const match of matches) {
      if (merged.length === 0) {
        merged.push(match);
      } else {
        const last = merged[merged.length - 1];
        if (match.start <= last.end) {
          // Overlapping: extend the last match
          last.end = Math.max(last.end, match.end);
        } else {
          // Non-overlapping: add new match
          merged.push(match);
        }
      }
    }

    // Build highlighted text
    let result = '';
    let lastPos = 0;
    for (const match of merged) {
      // Add text before match
      result += this._escapeHtml(text.slice(lastPos, match.start));
      // Add highlighted match
      result += `<mark>${this._escapeHtml(text.slice(match.start, match.end))}</mark>`;
      lastPos = match.end;
    }
    // Add remaining text
    result += this._escapeHtml(text.slice(lastPos));

    return result;
  }

  /**
   * _escapeHtml(text)
   * Escapes HTML special characters
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

/**
 * debounce(func, wait)
 * Debounces a function call
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
