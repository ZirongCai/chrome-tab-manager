/* ================================================================
   Tab Manager — Search Overlay Script
   ================================================================ */

'use strict';

import {
  TabManager,
  TabGroupManager,
  BookmarkManager,
  TextHelpers,
  DOMHelpers,
  ICONS
} from './core.js';

import { UnifiedSearch, debounce, loadUserPins, addUserPin, removeUserPin, updateUserPinName, isUserPinned } from './search.js';
import { FRIENDLY_DOMAINS } from './domain-names.js';
import { SEARCH_CONFIG, TIMING, TAB_GROUP_COLORS } from './constants.js';

// Use shared escapeHtml from DOMHelpers
// SECURITY: All user-provided content (titles, URLs, custom names) MUST be escaped
// before insertion into innerHTML. See renderResults(), renderBrowseTab(), etc.
const escapeHtml = DOMHelpers.escapeHtml;

/* ================================================================
   STATE INVENTORY

   All module-level state variables are declared here.
   See individual comments for purpose, type, and mutation points.
   ================================================================ */

/**
 * @type {UnifiedSearch|null}
 * Search engine instance. Initialized in init(), holds tabs/bookmarks index.
 * Mutated by: init() (create), searchInstance.reloadUserPins() (update pins)
 */
let searchInstance = null;

/**
 * @type {number}
 * Currently selected item index in search results. -1 means no selection.
 * Mutated by: handleSearch (reset), arrow keys (increment/decrement), updateSelection
 */
let selectedIndex = -1;

/**
 * @type {boolean}
 * True when user has typed "/" and is selecting a command.
 * Mutated by: handleSearch (set true on "/"), activateCommand (set false), Escape key
 */
let commandMode = false;

/**
 * @type {string|null}
 * Name of the currently active command (after selection). null when not in command mode.
 * Mutated by: activateCommand (set), Escape key (clear), executeCommand (use)
 */
let activeCommand = null;

// Max items shown before "Show more" button
const MAX_INITIAL_ITEMS = SEARCH_CONFIG.maxInitialItems;

/* ----------------------------------------------------------------
   BROWSE MODE STATE
   ---------------------------------------------------------------- */

/**
 * @type {'search'|'browse'}
 * Current UI mode. Controls which panel is visible.
 * Mutated by: switchMode()
 */
let currentMode = 'search';

/**
 * @type {object|null}
 * Cached browse data: { tabs, groups, domains, activeTabId, userPins, totalTabs, totalDomains, totalGroups }
 * Mutated by: loadBrowseData() (full replace), togglePinForUrl (userPins update)
 */
let browseData = null;

/**
 * @type {number}
 * Currently selected item index in browse mode. -1 means no selection.
 * Mutated by: handleBrowseNavigation (increment/decrement)
 */
let browseSelectedIndex = -1;

/**
 * @type {Set<string>}
 * Set of COLLAPSED domain hostnames. Domains not in set are expanded (default).
 * Mutated by: toggleDomainExpand()
 */
let expandedDomains = new Set();

/**
 * @type {Set<number>}
 * Set of COLLAPSED tab group IDs. Groups not in set are expanded (default).
 * Mutated by: toggleTabGroupExpand()
 */
let expandedGroups = new Set();

/**
 * @type {string}
 * Current filter query for Browse Mode. Empty string means no filter.
 * Mutated by: handleBrowseFilter(), clearBrowseFilter(), switchMode()
 */
let browseFilterQuery = '';

/**
 * @type {object|null}
 * Fuse.js instance for Browse Mode filtering.
 * Mutated by: initBrowseFilter()
 */
let browseFuseInstance = null;

/* ----------------------------------------------------------------
   CACHED DATA
   ---------------------------------------------------------------- */

/**
 * @type {object}
 * Custom domain display names from Chrome storage. { hostname: displayName }
 * Mutated by: loadCustomDomainNames(), saveCustomDomainName(), removeCustomDomainName()
 */
let customDomainNames = {};

/**
 * @type {boolean}
 * Flag to prevent duplicate browse click handler setup.
 * Mutated by: setupBrowseClickHandlers() (set true once)
 */
let browseHandlersSetup = false;

/**
 * @type {boolean}
 * Flag to prevent duplicate browse filter handler setup.
 * Mutated by: setupBrowseFilter() (set true once)
 */
let browseFilterSetup = false;

/* ----------------------------------------------------------------
   CONSTANTS
   ---------------------------------------------------------------- */

// Available commands - extensible framework for future commands
// To add a command: { name: 'example', icon: '🔧', description: 'Description', placeholder: 'Prompt...' }
const COMMANDS = [
  {
    name: 'tabs',
    icon: '📑',
    description: 'Search only open tabs',
    placeholder: 'Search open tabs...'
  }
];

/* ================================================================
   CUSTOM DOMAIN NAMES STORAGE
   ================================================================ */

/**
 * Load custom domain names from Chrome storage
 */
async function loadCustomDomainNames() {
  try {
    const { customDomainNames: stored } = await chrome.storage.local.get('customDomainNames');
    customDomainNames = stored || {};
    return customDomainNames;
  } catch (error) {
    console.error('[CustomDomains] Failed to load:', error);
    customDomainNames = {};
    return customDomainNames;
  }
}

/**
 * Save a custom domain name to Chrome storage
 * @param {string} domain - The domain hostname (e.g., "github.com")
 * @param {string} customName - The custom display name
 */
async function saveCustomDomainName(domain, customName) {
  try {
    customDomainNames[domain] = customName;
    await chrome.storage.local.set({ customDomainNames });
    return true;
  } catch (error) {
    console.error('[CustomDomains] Failed to save:', error);
    return false;
  }
}

/**
 * Remove a custom domain name (reset to default)
 * @param {string} domain - The domain hostname
 */
async function removeCustomDomainName(domain) {
  try {
    delete customDomainNames[domain];
    await chrome.storage.local.set({ customDomainNames });
    return true;
  } catch (error) {
    console.error('[CustomDomains] Failed to remove:', error);
    return false;
  }
}

/**
 * Get display name for a domain
 * Priority: Chrome storage > domain-names.js > cleaned hostname
 * @param {string} domain - The domain hostname
 * @returns {string} The display name
 */
function getDisplayName(domain) {
  // 1. Check Chrome storage (user customizations from UI)
  if (customDomainNames[domain]) {
    return customDomainNames[domain];
  }
  // 2. Check domain-names.js (file-based config)
  if (FRIENDLY_DOMAINS[domain]) {
    return FRIENDLY_DOMAINS[domain];
  }
  // 3. Fallback: use TextHelpers.friendlyDomain from core.js
  return TextHelpers.friendlyDomain(domain);
}

async function init() {
  // Load custom domain names first
  await loadCustomDomainNames();

  // Load data
  const [tabs, bookmarks] = await Promise.all([
    TabManager.fetchOpenTabs(),
    BookmarkManager.fetchTree()
  ]);

  const realTabs = TabManager.getRealTabs(tabs);
  const flatBookmarks = BookmarkManager.flattenTree(bookmarks);

  searchInstance = new UnifiedSearch(realTabs, flatBookmarks, { maxResults: 100 });

  // Initialize user pins from storage
  await searchInstance.initUserPins();

  setupSearch();
  setupKeyboardShortcuts();
  setupModeTabs();

  document.getElementById('searchInput').focus();
  document.querySelector('#searchMode .loading').style.display = 'none';

  // Initialize shortcuts footer for search mode
  updateShortcutsFooter('search');
}

/**
 * Setup mode tab click handlers
 */
function setupModeTabs() {
  const modeTabs = document.querySelectorAll('.mode-tab');
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      switchMode(mode);
    });
  });
}

/**
 * Switch between search and browse modes
 *
 * STATE TRANSITIONS:
 * - Updates: currentMode (to new mode)
 * - Preserves: searchInstance, selectedIndex (in search mode), browseData (cached)
 * - Resets: browseSelectedIndex when entering browse mode
 *
 * @param {string} mode - 'search' or 'browse'
 */
async function switchMode(mode) {
  if (mode === currentMode) return;

  // Update mode state
  currentMode = mode;

  // Clear browse filter when switching modes
  if (browseFilterQuery) {
    browseFilterQuery = '';
    const filterInput = document.getElementById('browseFilterInput');
    if (filterInput) filterInput.value = '';
  }

  // Update body class for fullscreen browse mode
  document.body.classList.toggle('browse-mode', mode === 'browse');

  // Update tab active states
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  // Update content visibility
  document.getElementById('searchMode').classList.toggle('active', mode === 'search');
  document.getElementById('browseMode').classList.toggle('active', mode === 'browse');

  // Update shortcuts footer
  updateShortcutsFooter(mode);

  if (mode === 'search') {
    // Focus search input when switching to search mode
    document.getElementById('searchInput').focus();
  } else if (mode === 'browse') {
    // Load browse data if not already loaded
    if (!browseData) {
      await loadBrowseData();
    }
    initBrowseFilter();
    renderBrowseMode();
    setupBrowseFilter();

    // Focus filter input
    const filterInput = document.getElementById('browseFilterInput');
    if (filterInput) filterInput.focus();
  }
}

/**
 * Update keyboard shortcuts footer based on current mode
 * @param {string} mode - 'search' or 'browse'
 */
function updateShortcutsFooter(mode) {
  const footer = document.getElementById('shortcutsFooter');
  if (!footer) return;

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl';

  // Show global Chrome extension shortcuts (from manifest.json) + Pin shortcut
  footer.innerHTML = `
    <div class="shortcut-item"><kbd>${cmdKey}⇧K</kbd><span>Quick Search</span></div>
    <div class="shortcut-item"><kbd>${cmdKey}⇧L</kbd><span>New Group</span></div>
    <div class="shortcut-item"><kbd>${cmdKey}⇧P</kbd><span>Pin Page</span></div>
  `;
}


function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  const handleSearch = debounce(async (query) => {
    if (!query || query.trim().length === 0) {
      // Don't clear activeCommand if we're in command mode
      if (!activeCommand) {
        searchResults.innerHTML = '';
        selectedIndex = -1;
        commandMode = false;
        updateSearchInputStyle();
      }
      return;
    }

    // Step 1: Command mode - user types "/" to see available commands
    if (query === '/' && !activeCommand) {
      commandMode = true;
      displayCommands(COMMANDS);
      selectedIndex = 0; // Auto-select first command
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const commandItems = document.querySelectorAll('.command-item');
        updateSelection(Array.from(commandItems));
      }, 0);
      return;
    }

    // Step 2: Command selection - filter commands as user types
    if (query.startsWith('/') && !activeCommand) {
      commandMode = true;
      const searchTerm = query.substring(1).toLowerCase();

      const filteredCommands = COMMANDS.filter(cmd =>
        cmd.name.toLowerCase().startsWith(searchTerm) ||
        cmd.name.toLowerCase().includes(searchTerm)
      );
      displayCommands(filteredCommands);
      selectedIndex = filteredCommands.length > 0 ? 0 : -1; // Auto-select first matching command
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const commandItems = document.querySelectorAll('.command-item');
        updateSelection(Array.from(commandItems));
      }, 0);
      return;
    }

    // Step 3: Active command mode - user has selected a command, entering their query
    if (activeCommand) {
      // Perform live search for supported commands
      if (activeCommand === 'tabs' && query.trim()) {
        await executeCommand('tabs', query);
      }
      return;
    }

    // Normal search
    const results = await searchInstance.search(query);

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="empty">No results found</div>';
      return;
    }

    selectedIndex = -1;
    searchResults.innerHTML = renderResults(results, query);
  }, 150);

  searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    // Tab key: switch to Browse Mode when search is empty
    if (e.key === 'Tab' && !e.shiftKey) {
      const query = searchInput.value.trim();
      console.log('[Tab] query:', query, 'commandMode:', commandMode, 'activeCommand:', activeCommand);
      if (!query && !commandMode && !activeCommand) {
        e.preventDefault();
        e.stopPropagation();
        console.log('[Tab] Switching to browse mode');
        switchMode('browse');
        return;
      }
    }

    // Handle Enter key
    if (e.key === 'Enter') {
      e.preventDefault();

      // If in command mode and a command is selected
      if (commandMode && selectedIndex >= 0) {
        const commands = searchResults.querySelectorAll('.command-item');
        const selectedCmd = commands[selectedIndex];
        if (selectedCmd) {
          const cmdName = selectedCmd.dataset.command;
          activateCommand(cmdName);
        }
        return;
      }

      // If in active command mode, activate selected result or execute command
      if (activeCommand) {
        // Check if there's a selected result to activate
        const allItems = Array.from(searchResults.querySelectorAll('.result-group-header:not(.pinned-header), .result-item, .show-more-btn'));
        const items = allItems.filter(item => {
          const hiddenParent = item.closest('.result-group-hidden');
          if (hiddenParent && hiddenParent.style.display === 'none') {
            return false;
          }
          return true;
        });

        if (selectedIndex >= 0 && items[selectedIndex]) {
          const selectedItem = items[selectedIndex];
          if (selectedItem.classList.contains('show-more-btn')) {
            selectedItem.click();
          } else {
            activateResult(selectedItem);
          }
        } else if (items.length > 0) {
          // If no selection but results exist, activate first result
          activateResult(items[0]);
        }
        return;
      }

      // Normal search - activate selected result
      const allItems = Array.from(searchResults.querySelectorAll('.result-group-header:not(.pinned-header), .result-item, .show-more-btn'));
      const items = allItems.filter(item => {
        const hiddenParent = item.closest('.result-group-hidden');
        if (hiddenParent && hiddenParent.style.display === 'none') {
          return false;
        }
        return true;
      });

      if (selectedIndex >= 0 && items[selectedIndex]) {
        const selectedItem = items[selectedIndex];
        if (selectedItem.classList.contains('show-more-btn')) {
          const currentIndex = selectedIndex;
          selectedItem.click();
          setTimeout(() => {
            const allItemsAfter = Array.from(searchResults.querySelectorAll('.result-group-header:not(.pinned-header), .result-item, .show-more-btn'));
            const itemsAfter = allItemsAfter.filter(item => {
              const hiddenParent = item.closest('.result-group-hidden');
              if (hiddenParent && hiddenParent.style.display === 'none') {
                return false;
              }
              return true;
            });
            selectedIndex = currentIndex;
            updateSelection(itemsAfter);
          }, 50);
        } else {
          activateResult(selectedItem);
        }
      } else if (items.length > 0) {
        // If nothing selected but there are results, select and activate first item
        activateResult(items[0]);
      }
      return;
    }

    // Handle Escape to exit modes
    if (e.key === 'Escape') {
      e.preventDefault();
      if (activeCommand) {
        // Exit command mode
        activeCommand = null;
        commandMode = false;
        searchInput.value = '';
        searchResults.innerHTML = '';
        updateSearchInputStyle();
      } else if (commandMode) {
        // Exit command selection
        commandMode = false;
        searchInput.value = '';
        searchResults.innerHTML = '';
      }
      // Don't close window, let user use Cmd+W
      return;
    }

    // Arrow key navigation
    const allItems = commandMode
      ? Array.from(searchResults.querySelectorAll('.command-item'))
      : Array.from(searchResults.querySelectorAll('.result-group-header:not(.pinned-header), .result-item, .show-more-btn')).filter(item => {
          const hiddenParent = item.closest('.result-group-hidden');
          if (hiddenParent && hiddenParent.style.display === 'none') {
            return false;
          }
          return true;
        });

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, allItems.length - 1);
      updateSelection(allItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateSelection(allItems);
    }
  });

  // Click handling
  searchResults.addEventListener('click', async (e) => {
    // Edit button click
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      e.stopPropagation();
      e.preventDefault();

      const url = editBtn.dataset.url;
      const originalTitle = editBtn.dataset.title;
      const currentCustomName = editBtn.dataset.customName || '';

      // Show edit dialog
      showEditPinDialog(url, originalTitle, currentCustomName);
      return;
    }

    // Pin button click
    const pinBtn = e.target.closest('.pin-btn');
    if (pinBtn) {
      e.stopPropagation();
      e.preventDefault();

      const url = pinBtn.dataset.url;
      const title = pinBtn.dataset.title;

      if (pinBtn.classList.contains('pinned')) {
        // Unpin
        await removeUserPin(url);
        pinBtn.classList.remove('pinned');
        pinBtn.title = 'Pin this URL';
        pinBtn.querySelector('svg').style.fill = '';
      } else {
        // Pin
        await addUserPin(url, title);
        pinBtn.classList.add('pinned');
        pinBtn.title = 'Unpin this URL';
        pinBtn.querySelector('svg').style.fill = '#d68900';
      }

      // Reload user pins in search instance
      await searchInstance.reloadUserPins();

      // Re-trigger search to update results
      const searchInput = document.getElementById('searchInput');
      if (searchInput.value.trim()) {
        const results = await searchInstance.search(searchInput.value);
        if (results.length > 0) {
          searchResults.innerHTML = renderResults(results, searchInput.value);
        }
      }
      return;
    }

    // Command item
    const commandItem = e.target.closest('.command-item');
    if (commandItem) {
      const cmdName = commandItem.dataset.command;
      activateCommand(cmdName);
      return;
    }

    // Result item
    const item = e.target.closest('.result-item');
    if (item) {
      activateResult(item);
      return;
    }

    // Show more button
    if (e.target.closest('.show-more-btn')) {
      e.stopPropagation();
      const btn = e.target.closest('.show-more-btn');
      const groupUrl = btn.dataset.groupUrl;
      const resultGroup = btn.closest('.result-group');
      const hiddenDiv = resultGroup.querySelector('.result-group-hidden');
      const itemsDiv = resultGroup.querySelector('.result-group-items');

      if (hiddenDiv && hiddenDiv.style.display === 'none') {
        // Show hidden items
        hiddenDiv.style.display = 'block';
        // Move hidden items into main items div
        itemsDiv.appendChild(hiddenDiv);
        hiddenDiv.style.display = 'contents'; // Make it transparent
        btn.innerHTML = `
          <span class="show-more-text">Show less</span>
          <svg class="show-more-icon" style="transform: rotate(180deg);" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        `;
        btn.classList.add('expanded');
      } else {
        // Hide items (reload to reset)
        const searchInput = document.getElementById('searchInput');
        handleSearch(searchInput.value);
      }
      return;
    }

    // Group header (skip pinned group header as it has no URL)
    const groupHeader = e.target.closest('.result-group-header');
    if (groupHeader && !groupHeader.classList.contains('pinned-header')) {
      activateResult(groupHeader);
      return;
    }
  });
}

function setupKeyboardShortcuts() {
  // Click outside to close
  document.body.addEventListener('click', (e) => {
    if (e.target === document.body) {
      window.close();
    }
  });

  // Global keyboard shortcuts for Browse Mode
  document.addEventListener('keydown', (e) => {
    // Only handle when in Browse Mode
    if (currentMode !== 'browse') return;

    // Skip if filter input is focused - let it handle its own keys
    const filterInput = document.getElementById('browseFilterInput');
    const filterFocused = document.activeElement === filterInput;

    // Escape: handled by filter input when focused, otherwise return to Search Mode
    if (e.key === 'Escape') {
      if (filterFocused) {
        // Let the filter input's own handler deal with this
        return;
      }
      e.preventDefault();
      switchMode('search');
      return;
    }

    // Tab: return to Search Mode
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      switchMode('search');
      return;
    }

    // Arrow navigation in Browse Mode
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleBrowseNavigation(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    // Enter: activate selected item
    if (e.key === 'Enter') {
      e.preventDefault();
      activateBrowseSelection();
      return;
    }

    // Cmd+Backspace: close selected tab (but not when filter input is focused)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace') {
      const filterInput = document.getElementById('browseFilterInput');
      if (document.activeElement === filterInput) {
        // Let the default behavior handle text deletion in the input
        return;
      }
      e.preventDefault();
      closeBrowseSelectedTab();
      return;
    }

    // Cmd/Ctrl+Shift+P: pin/unpin current active tab
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      togglePinCurrentTab();
      return;
    }
  });
}

function renderResults(results, query) {
  // Helper to check if a URL is user-pinned (uses searchInstance)
  const checkUserPinned = (url) => {
    return searchInstance.userPins.some(p => p.url === url);
  };

  // Helper to get custom name for a pinned URL
  const getCustomName = (url) => {
    const pin = searchInstance.userPins.find(p => p.url === url);
    return pin ? pin.customName || '' : '';
  };

  // Helper to render a single result item with pin button
  const renderItem = (result) => {
    const highlightedTitle = searchInstance.highlightMatch(result.title, query);
    const icon = result.type === 'pinned' ? '📌' : result.type === 'tab' ? ICONS.tabs : result.type === 'bookmark' ? ICONS.bookmark : ICONS.history;
    const userPinned = checkUserPinned(result.url);
    const pinButtonClass = userPinned ? 'pin-btn pinned' : 'pin-btn';
    const pinTitle = userPinned ? 'Unpin this URL' : 'Pin this URL';

    // Show edit button only for pinned items
    const editButton = result.type === 'pinned' ? `
      <button class="edit-btn" title="Edit custom name" data-url="${escapeHtml(result.url)}" data-title="${escapeHtml(result.originalTitle || result.title)}" data-custom-name="${escapeHtml(result.customName || '')}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
      </button>
    ` : '';

    return `
      <div class="result-item" data-type="${result.type}" data-url="${escapeHtml(result.url)}" data-title="${escapeHtml(result.title)}">
        <span class="result-icon">${icon}</span>
        <div class="result-content">
          <div class="result-title">${highlightedTitle}</div>
          <div class="result-url">${escapeHtml(result.url)}</div>
        </div>
        ${editButton}
        <button class="${pinButtonClass}" title="${pinTitle}" data-url="${escapeHtml(result.url)}" data-title="${escapeHtml(result.title)}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 17v5"/>
            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
          </svg>
        </button>
        <span class="result-badge ${result.type}">${result.type}</span>
      </div>
    `;
  };

  return results.map(group => {
    // Special rendering for the dedicated Pinned group (with collapse support)
    if (group.isPinnedGroup) {
      const totalItems = group.items.length;
      const hasMore = totalItems > MAX_INITIAL_ITEMS;
      const initialItems = group.items.slice(0, MAX_INITIAL_ITEMS);
      const hiddenItems = hasMore ? group.items.slice(MAX_INITIAL_ITEMS) : [];

      const initialItemsHtml = initialItems.map(renderItem).join('');
      const hiddenItemsHtml = hiddenItems.map(renderItem).join('');

      return `
        <div class="result-group pinned-group" data-group-url="__pinned__">
          <div class="result-group-header pinned-header">
            <span class="group-icon">📌</span>
            <span class="group-label">Pinned</span>
            <span class="group-count">${totalItems} pinned</span>
          </div>
          <div class="result-group-items">
            ${initialItemsHtml}
          </div>
          ${hasMore ? `
            <div class="result-group-hidden" style="display: none;">
              ${hiddenItemsHtml}
            </div>
            <button class="show-more-btn" data-group-url="__pinned__">
              <span class="show-more-text">Show ${hiddenItems.length} more</span>
              <svg class="show-more-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          ` : ''}
        </div>
      `;
    }

    if (group.items.length > 1) {
      // Render as group with header
      const totalItems = group.items.length;
      const hasMore = totalItems > MAX_INITIAL_ITEMS;
      const initialItems = group.items.slice(0, MAX_INITIAL_ITEMS);
      const hiddenItems = hasMore ? group.items.slice(MAX_INITIAL_ITEMS) : [];

      const initialItemsHtml = initialItems.map(renderItem).join('');
      const hiddenItemsHtml = hiddenItems.map(renderItem).join('');

      // Extract group label
      let groupLabel;
      let groupIcon = '🌐';

      // Check if it's a Gardener group based on baseUrl
      if (group.baseUrl && group.baseUrl.startsWith('garden-')) {
        // Gardener group format: garden-<environment>:<namespace>
        const parts = group.baseUrl.split(':');
        if (parts.length === 2) {
          const [envPart, namespace] = parts;
          const environment = envPart.replace('garden-', '');
          groupLabel = `Garden ${environment.charAt(0).toUpperCase() + environment.slice(1)} / ${namespace}`;
          groupIcon = '🌱';
        } else {
          groupLabel = group.baseUrl;
        }
      } else if (group.baseUrl && group.baseUrl.startsWith('jira:')) {
        // Jira group: show project name
        const projectId = group.baseUrl.replace('jira:', '');
        groupLabel = `Jira: ${projectId}`;
        groupIcon = '🎫';
      } else {
        // Default: extract from URL
        try {
          const url = new URL(group.mainUrl);
          const pathParts = url.pathname.split('/').filter(p => p.length > 0);
          if (pathParts.length >= 2) {
            groupLabel = pathParts.slice(-2).join('/');
          } else if (pathParts.length === 1) {
            groupLabel = pathParts[0];
          } else {
            groupLabel = url.hostname.replace(/^www\./, '');
          }
        } catch {
          groupLabel = group.mainUrl;
        }
      }

      return `
        <div class="result-group" data-group-url="${escapeHtml(group.mainUrl)}">
          <div class="result-group-header" data-url="${escapeHtml(group.mainUrl)}">
            <span class="group-icon">${groupIcon}</span>
            <span class="group-label">${escapeHtml(groupLabel)}</span>
            <span class="group-count">${totalItems} pages</span>
            <span class="group-arrow">→</span>
          </div>
          <div class="result-group-items">
            ${initialItemsHtml}
          </div>
          ${hasMore ? `
            <div class="result-group-hidden" style="display: none;">
              ${hiddenItemsHtml}
            </div>
            <button class="show-more-btn" data-group-url="${escapeHtml(group.mainUrl)}">
              <span class="show-more-text">Show ${hiddenItems.length} more</span>
              <svg class="show-more-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          ` : ''}
        </div>
      `;
    } else {
      // Single item
      const result = group.items[0];
      return renderItem(result);
    }
  }).join('');
}

function updateSelection(items) {
  items.forEach((item, i) => {
    item.classList.toggle('selected', i === selectedIndex);
    if (i === selectedIndex) {
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

async function activateResult(item) {
  // Handle group header
  if (item.classList.contains('result-group-header')) {
    const url = item.dataset.url;
    const newTab = await chrome.tabs.create({ url });

    // Manually add to focused group to avoid race condition
    try {
      const { focusedGroupId } = await chrome.storage.local.get('focusedGroupId');
      if (focusedGroupId) {
        await chrome.tabs.group({ tabIds: [newTab.id], groupId: focusedGroupId });
      }
    } catch (error) {
      // Group might not exist anymore
    }

    window.close();
    return;
  }

  // Handle regular result item
  const type = item.dataset.type;
  const url = item.dataset.url;

  if (type === 'tab') {
    await TabManager.focusTab(url);
  } else if (type === 'pinned') {
    // Pinned URLs always open in new tab
    const newTab = await chrome.tabs.create({ url });

    // Manually add to focused group to avoid race condition
    try {
      const { focusedGroupId } = await chrome.storage.local.get('focusedGroupId');
      if (focusedGroupId) {
        await chrome.tabs.group({ tabIds: [newTab.id], groupId: focusedGroupId });
      }
    } catch (error) {
      // Group might not exist anymore
    }
  } else {
    const newTab = await chrome.tabs.create({ url });

    // Manually add to focused group to avoid race condition
    try {
      const { focusedGroupId } = await chrome.storage.local.get('focusedGroupId');
      if (focusedGroupId) {
        await chrome.tabs.group({ tabIds: [newTab.id], groupId: focusedGroupId });
      }
    } catch (error) {
      // Group might not exist anymore
    }
  }

  window.close();
}

function displayCommands(commands) {
  const searchResults = document.getElementById('searchResults');
  selectedIndex = -1;

  if (commands.length === 0) {
    searchResults.innerHTML = `
      <div class="command-mode-header">
        <span class="command-mode-badge">Commands</span>
      </div>
      <div class="empty" style="margin-top: 8px;">
        <p>No commands available</p>
        <p style="font-size: 12px; color: var(--muted); margin-top: 8px;">
          Commands can be added in future updates.
        </p>
      </div>
    `;
    return;
  }

  const html = commands.map(cmd => `
    <div class="command-item" data-command="${cmd.name}">
      <span class="command-icon">${cmd.icon}</span>
      <div class="command-content">
        <div class="command-name">/${cmd.name}</div>
        <div class="command-desc">${cmd.description}</div>
      </div>
    </div>
  `).join('');

  searchResults.innerHTML = `
    <div class="command-mode-header">
      <span class="command-mode-badge">Commands</span>
      <span class="command-mode-hint">Press Enter to select</span>
    </div>
    ${html}
  `;
}

function activateCommand(commandName) {
  const command = COMMANDS.find(cmd => cmd.name === commandName);
  if (!command) return;

  commandMode = false;
  activeCommand = commandName;
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  searchInput.value = '';
  searchResults.innerHTML = '';
  updateSearchInputStyle();
}

function updateSearchInputStyle() {
  const searchInput = document.getElementById('searchInput');
  const container = searchInput.closest('.search-input-area');

  // Remove existing indicators
  const existingIndicator = document.getElementById('commandModeIndicator');
  if (existingIndicator) existingIndicator.remove();
  const existingTabsIndicator = document.getElementById('tabsOnlyIndicator');
  if (existingTabsIndicator) existingTabsIndicator.remove();

  if (activeCommand) {
    const command = COMMANDS.find(cmd => cmd.name === activeCommand);
    if (command) {
      const indicator = document.createElement('div');
      indicator.id = 'commandModeIndicator';
      indicator.className = 'command-mode-indicator';
      indicator.textContent = `${command.icon} ${command.name}`;
      container.insertBefore(indicator, searchInput);
      searchInput.placeholder = command.placeholder;
    }
  } else {
    searchInput.placeholder = 'Search tabs, bookmarks, history... (Try /)';
  }
}

async function executeCommand(commandName, query) {
  const searchResults = document.getElementById('searchResults');

  if (commandName === 'tabs') {
    // Search only open tabs
    let results = await searchInstance.search(query);
    results = results
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.type === 'tab')
      }))
      .filter(group => group.items.length > 0);

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="empty">No matching tabs found</div>';
      return;
    }

    selectedIndex = -1;
    searchResults.innerHTML = renderResults(results, query);
    return;
  }

  // Unknown command fallback
  searchResults.innerHTML = `
    <div class="empty">
      <p>Unknown command: ${commandName}</p>
    </div>
  `;
}

/**
 * Show edit dialog for pin custom name
 */
function showEditPinDialog(url, originalTitle, currentCustomName) {
  // Remove existing dialog if any
  const existingDialog = document.getElementById('editPinDialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  const dialog = document.createElement('div');
  dialog.id = 'editPinDialog';
  dialog.className = 'edit-pin-dialog-overlay';
  dialog.innerHTML = `
    <div class="edit-pin-dialog">
      <div class="edit-pin-header">
        <span class="edit-pin-icon">✏️</span>
        <span class="edit-pin-title">Edit Pin Name</span>
      </div>
      <div class="edit-pin-content">
        <div class="edit-pin-original">
          <label>Original title:</label>
          <span>${escapeHtml(originalTitle)}</span>
        </div>
        <div class="edit-pin-field">
          <label for="customNameInput">Custom name:</label>
          <input type="text" id="customNameInput" placeholder="Enter custom name (leave empty to use original)" value="${escapeHtml(currentCustomName)}">
        </div>
        <div class="edit-pin-url">
          <label>URL:</label>
          <span>${escapeHtml(url)}</span>
        </div>
      </div>
      <div class="edit-pin-actions">
        <button class="edit-pin-cancel">Cancel</button>
        <button class="edit-pin-save">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  const input = dialog.querySelector('#customNameInput');
  const saveBtn = dialog.querySelector('.edit-pin-save');
  const cancelBtn = dialog.querySelector('.edit-pin-cancel');

  // Focus input
  setTimeout(() => input.focus(), 50);

  // Save handler
  const saveHandler = async () => {
    const newCustomName = input.value.trim();
    await updateUserPinName(url, newCustomName);
    await searchInstance.reloadUserPins();

    // Re-trigger search to update results
    const searchInput = document.getElementById('searchInput');
    if (searchInput.value.trim()) {
      const results = await searchInstance.search(searchInput.value);
      const searchResults = document.getElementById('searchResults');
      if (results.length > 0) {
        searchResults.innerHTML = renderResults(results, searchInput.value);
      }
    }

    dialog.remove();
    document.getElementById('searchInput').focus();
  };

  // Cancel handler
  const cancelHandler = () => {
    dialog.remove();
    document.getElementById('searchInput').focus();
  };

  saveBtn.addEventListener('click', saveHandler);
  cancelBtn.addEventListener('click', cancelHandler);

  // Handle Enter and Escape keys
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveHandler();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelHandler();
    }
  });

  // Close on overlay click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      cancelHandler();
    }
  });
}

/* ================================================================
   BROWSE MODE FUNCTIONS
   ================================================================ */

/**
 * Initialize Fuse.js instance for Browse Mode filtering
 */
function initBrowseFilter() {
  if (!browseData || !browseData.tabs) return;

  // Create Fuse instance with tabs data
  browseFuseInstance = new Fuse(browseData.tabs, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'url', weight: 0.3 }
    ],
    threshold: 0.4,
    minMatchCharLength: 2,
    includeScore: true
  });
}

/**
 * Handle Browse Mode filter input
 * @param {string} query - Filter query
 */
const handleBrowseFilter = debounce((query) => {
  browseFilterQuery = query.trim();
  renderBrowseMode();
  updateBrowseFilterCount();
}, 100);

/**
 * Clear Browse Mode filter
 */
function clearBrowseFilter() {
  browseFilterQuery = '';
  const filterInput = document.getElementById('browseFilterInput');
  if (filterInput) {
    filterInput.value = '';
  }
  renderBrowseMode();
  updateBrowseFilterCount();
}

/**
 * Update the filter count display
 */
function updateBrowseFilterCount() {
  const countEl = document.getElementById('browseFilterCount');
  if (!countEl || !browseData) return;

  if (browseFilterQuery) {
    const filteredTabs = getFilteredTabs();
    countEl.textContent = `${filteredTabs.length} of ${browseData.totalTabs} tabs`;
    countEl.classList.add('visible');
  } else {
    countEl.classList.remove('visible');
  }
}

/**
 * Get tabs filtered by current browse filter query
 * @returns {Array} Filtered tabs
 */
function getFilteredTabs() {
  if (!browseData || !browseData.tabs) return [];
  if (!browseFilterQuery) return browseData.tabs;

  if (!browseFuseInstance) {
    initBrowseFilter();
  }

  const results = browseFuseInstance.search(browseFilterQuery);
  return results.map(r => r.item);
}

/**
 * Check if a tab matches the current filter
 * @param {object} tab - Tab object
 * @returns {boolean} Whether the tab matches
 */
function tabMatchesFilter(tab) {
  if (!browseFilterQuery) return true;

  const filteredTabs = getFilteredTabs();
  return filteredTabs.some(t => t.id === tab.id);
}

/**
 * Setup Browse Mode filter event listeners
 */
function setupBrowseFilter() {
  if (browseFilterSetup) return;

  const filterInput = document.getElementById('browseFilterInput');
  if (!filterInput) return;

  browseFilterSetup = true;

  filterInput.addEventListener('input', (e) => {
    handleBrowseFilter(e.target.value);
  });

  filterInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (browseFilterQuery) {
        // Clear filter first
        clearBrowseFilter();
        filterInput.focus();
      } else {
        // Switch back to search mode if filter is already empty
        switchMode('search');
      }
    }
  });
}

/**
 * Find duplicate tabs (same URL appearing multiple times)
 * @param {Array} tabs - Array of tab objects
 * @returns {{ count: number, urls: string[] }} - Count of duplicates and list of duplicate URLs
 */
function findDuplicateTabs(tabs) {
  const urlCounts = new Map();

  // Count occurrences of each URL
  for (const tab of tabs) {
    const count = urlCounts.get(tab.url) || 0;
    urlCounts.set(tab.url, count + 1);
  }

  // Find URLs with more than one occurrence
  const duplicateUrls = [];
  let duplicateCount = 0;

  for (const [url, count] of urlCounts) {
    if (count > 1) {
      duplicateUrls.push(url);
      duplicateCount += count - 1; // Count extra tabs (total - 1 kept)
    }
  }

  return {
    count: duplicateCount,
    urls: duplicateUrls
  };
}

/**
 * Deduplicate tabs - close duplicate tabs keeping one per URL
 * Prefers keeping the active tab, otherwise keeps the first one
 */
async function deduplicateTabs() {
  if (!browseData || !browseData.tabs) return;

  const { urls } = findDuplicateTabs(browseData.tabs);

  if (urls.length === 0) {
    // No duplicates found
    showToast('No duplicate tabs found');
    return;
  }

  // Use TabManager.closeDuplicateTabs to close duplicates
  const countBefore = browseData.tabs.length;
  await TabManager.closeDuplicateTabs(urls, true);

  // Reload browse data and re-render
  await loadBrowseData();
  renderBrowseMode();

  // Calculate how many were closed
  const countAfter = browseData.tabs.length;
  const closedCount = countBefore - countAfter;

  if (closedCount > 0) {
    showToast(`Closed ${closedCount} duplicate tab${closedCount > 1 ? 's' : ''}`);
  } else {
    showToast('No duplicate tabs found');
  }
}

/**
 * Simple toast notification (uses existing DOMHelpers pattern)
 */
function showToast(message) {
  // Check if toast element exists, create if not
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.innerHTML = '<span id="toastText"></span>';
    document.body.appendChild(toast);
  }

  const toastText = document.getElementById('toastText');
  if (toastText) toastText.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), TIMING.toastDuration);
}

/**
 * Toggle pin status for the current active tab
 */
async function togglePinCurrentTab() {
  if (!browseData || !browseData.activeTabId) {
    showToast('No active tab');
    return;
  }

  // Find the active tab
  const activeTab = browseData.tabs.find(t => t.id === browseData.activeTabId);
  if (!activeTab) {
    showToast('Active tab not found');
    return;
  }

  await togglePinForUrl(activeTab.url, activeTab.title || activeTab.url);
}

/**
 * Toggle pin status for a specific URL
 */
async function togglePinForUrl(url, title) {
  if (!url) return;

  // Check current pin status
  const isPinned = isUserPinned(url, browseData?.userPins || []);

  if (isPinned) {
    // Unpin
    await removeUserPin(url);
    showToast('Page unpinned');
  } else {
    // Pin
    await addUserPin(url, title);
    showToast('Page pinned');
  }

  // Reload user pins and re-render
  if (browseData) {
    browseData.userPins = await loadUserPins();
    renderBrowseMode();
  }
}

/**
 * Load data for Browse Mode
 */
async function loadBrowseData() {
  try {
    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTabId = activeTab ? activeTab.id : null;

    // Fetch tabs, groups, and user pins
    const [allTabs, groups, userPins] = await Promise.all([
      TabManager.fetchOpenTabs(),
      TabGroupManager.fetchGroups(),
      loadUserPins()
    ]);
    const realTabs = TabManager.getRealTabs(allTabs);

    // Separate grouped and ungrouped tabs
    const groupedTabs = realTabs.filter(t => t.groupId && t.groupId !== -1);
    const ungroupedTabs = realTabs.filter(t => !t.groupId || t.groupId === -1);

    // Group ungrouped tabs by domain
    const domainGroups = TabManager.groupTabsByDomain(ungroupedTabs);

    // Sort domain groups by tab count (descending)
    domainGroups.sort((a, b) => b.tabs.length - a.tabs.length);

    // Organize grouped tabs by their group
    const tabGroupsMap = new Map();
    for (const group of groups) {
      tabGroupsMap.set(group.id, {
        ...group,
        tabs: groupedTabs.filter(t => t.groupId === group.id)
      });
    }
    const tabGroups = Array.from(tabGroupsMap.values()).filter(g => g.tabs.length > 0);

    browseData = {
      tabs: realTabs,
      groups: tabGroups,
      domains: domainGroups,
      activeTabId,
      userPins,
      totalTabs: realTabs.length,
      totalDomains: domainGroups.length,
      totalGroups: tabGroups.length
    };

    return browseData;
  } catch (error) {
    console.error('[Browse] Failed to load data:', error);
    browseData = null;
    return null;
  }
}

/**
 * Render Browse Mode UI
 */
function renderBrowseMode() {
  if (!browseData) {
    document.getElementById('browseContent').innerHTML = '<div class="empty">Failed to load tabs</div>';
    return;
  }

  // Calculate duplicates
  const duplicateInfo = findDuplicateTabs(browseData.tabs);

  // Render stats with back button and deduplicate button
  const statsHtml = `
    <button class="browse-back-btn" id="browseBackBtn">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Search
    </button>
    <div class="browse-stats-group">
      <div class="browse-stat">
        <span class="browse-stat-value">${browseData.totalTabs}</span>
        <span class="browse-stat-label">tabs</span>
      </div>
      <div class="browse-stat">
        <span class="browse-stat-value">${browseData.totalDomains}</span>
        <span class="browse-stat-label">domains</span>
      </div>
      ${browseData.totalGroups > 0 ? `
        <div class="browse-stat">
          <span class="browse-stat-value">${browseData.totalGroups}</span>
          <span class="browse-stat-label">groups</span>
        </div>
      ` : ''}
      ${duplicateInfo.count > 0 ? `
        <div class="browse-stat duplicate-stat">
          <span class="browse-stat-value">${duplicateInfo.count}</span>
          <span class="browse-stat-label">duplicates</span>
        </div>
      ` : ''}
    </div>
    <button class="browse-dedupe-btn" id="browseDedupeBtn" ${duplicateInfo.count === 0 ? 'disabled' : ''}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
      Deduplicate${duplicateInfo.count > 0 ? ` (${duplicateInfo.count})` : ''}
    </button>
  `;
  document.getElementById('browseStats').innerHTML = statsHtml;

  // Setup back button handler
  document.getElementById('browseBackBtn').addEventListener('click', () => {
    switchMode('search');
  });

  // Setup deduplicate button handler
  const dedupeBtn = document.getElementById('browseDedupeBtn');
  if (dedupeBtn) {
    dedupeBtn.addEventListener('click', () => {
      deduplicateTabs();
    });
  }

  // Render content
  let contentHtml = '';

  // Tab Groups section
  if (browseData.groups.length > 0) {
    contentHtml += '<div class="browse-tab-groups">';
    contentHtml += browseData.groups.map(group => renderTabGroup(group)).join('');
    contentHtml += '</div>';
  }

  // Domain groups section
  contentHtml += browseData.domains.map(domain => renderDomainGroup(domain)).join('');

  document.getElementById('browseContent').innerHTML = contentHtml;

  // Setup click handlers
  setupBrowseClickHandlers();

  // Update filter count
  updateBrowseFilterCount();
}

/**
 * Render a Tab Group
 */
function renderTabGroup(group) {
  // Filter tabs if filter is active
  const filteredTabs = browseFilterQuery
    ? group.tabs.filter(tab => tabMatchesFilter(tab))
    : group.tabs;

  // Don't render group if no matching tabs
  if (filteredTabs.length === 0) return '';

  // Default to expanded
  const isExpanded = !expandedGroups.has(group.id); // inverted: set = collapsed
  const colorClass = `tab-group-${group.color || 'grey'}`;

  const tabsHtml = filteredTabs.map(tab => renderBrowseTab(tab)).join('');

  return `
    <div class="browse-tab-group ${isExpanded ? 'expanded' : ''}" data-group-id="${group.id}">
      <div class="browse-tab-group-header ${colorClass} ${isExpanded ? 'expanded' : ''}">
        <div class="browse-tab-group-color" style="background: ${getGroupColor(group.color)}"></div>
        <span class="browse-tab-group-name">${escapeHtml(group.title || 'Unnamed Group')}</span>
        <span class="browse-tab-group-count">${filteredTabs.length}</span>
        <svg class="browse-domain-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      <div class="browse-tab-group-tabs ${colorClass}">
        ${tabsHtml}
      </div>
    </div>
  `;
}

/**
 * Render a domain group
 */
function renderDomainGroup(domain) {
  // Filter tabs if filter is active
  const filteredTabs = browseFilterQuery
    ? domain.tabs.filter(tab => tabMatchesFilter(tab))
    : domain.tabs;

  // Don't render group if no matching tabs
  if (filteredTabs.length === 0) return '';

  // Default to expanded
  const isExpanded = !expandedDomains.has(domain.domain); // inverted: set = collapsed
  const favicon = filteredTabs[0]?.favIconUrl || '';

  // Get display name with priority: Chrome storage > domain-names.js > fallback
  const displayName = getDisplayName(domain.domain);
  const tabsHtml = filteredTabs.map(tab => renderBrowseTab(tab)).join('');

  return `
    <div class="browse-domain-group ${isExpanded ? 'expanded' : ''}" data-domain="${escapeHtml(domain.domain)}">
      <div class="browse-domain-header ${isExpanded ? 'expanded' : ''}">
        <img class="browse-domain-favicon" src="${favicon}" data-fallback="true">
        <span class="browse-domain-name" data-domain="${escapeHtml(domain.domain)}">${escapeHtml(displayName)}</span>
        <button class="browse-domain-edit" title="Rename this domain group" data-domain="${escapeHtml(domain.domain)}" data-name="${escapeHtml(displayName)}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
          </svg>
        </button>
        <span class="browse-domain-count">${filteredTabs.length}</span>
        <button class="browse-domain-close-all" title="Close all tabs in this domain" data-domain="${escapeHtml(domain.domain)}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <svg class="browse-domain-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      <div class="browse-domain-tabs">
        ${tabsHtml}
      </div>
    </div>
  `;
}

/**
 * Render a single tab item for Browse Mode
 */
function renderBrowseTab(tab) {
  const isActive = tab.id === browseData.activeTabId;
  const favicon = tab.favIconUrl || '';

  // Pin button for all tabs (like search mode)
  const isPinned = isUserPinned(tab.url, browseData.userPins || []);
  const pinClass = isPinned ? 'browse-tab-pin pinned' : 'browse-tab-pin';
  const pinTitle = isPinned ? 'Unpin this page' : 'Pin this page';
  const pinButtonHtml = `
    <button class="${pinClass}" title="${pinTitle}" data-url="${escapeHtml(tab.url)}" data-title="${escapeHtml(tab.title || tab.url)}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 17v5"/>
        <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
      </svg>
    </button>
  `;

  return `
    <div class="browse-tab-item ${isActive ? 'active-tab' : ''}" data-tab-id="${tab.id}" data-url="${escapeHtml(tab.url)}">
      <img class="browse-tab-favicon" src="${favicon}" data-fallback="true">
      <span class="browse-tab-title">${escapeHtml(tab.title || tab.url)}</span>
      ${pinButtonHtml}
      <button class="browse-tab-close" title="Close tab" data-tab-id="${tab.id}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  `;
}

/**
 * Get CSS color for Tab Group
 */
function getGroupColor(colorName) {
  return TAB_GROUP_COLORS[colorName] || TAB_GROUP_COLORS.grey;
}

/**
 * Setup click handlers for Browse Mode (called once)
 * Uses browseHandlersSetup flag (defined in state inventory) to prevent duplicate setup
 */
function setupBrowseClickHandlers() {
  if (browseHandlersSetup) return;
  browseHandlersSetup = true;

  const browseContent = document.getElementById('browseContent');

  // Handle favicon load errors via event delegation
  browseContent.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG' && e.target.dataset.fallback) {
      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239a918a"><circle cx="12" cy="12" r="10"/></svg>';
      e.target.removeAttribute('data-fallback');
    }
  }, true);

  browseContent.addEventListener('click', async (e) => {
    // Pin button for any tab
    const pinBtn = e.target.closest('.browse-tab-pin');
    if (pinBtn) {
      e.stopPropagation();
      const url = pinBtn.dataset.url;
      const title = pinBtn.dataset.title;
      await togglePinForUrl(url, title);
      return;
    }

    // Close tab button
    const closeBtn = e.target.closest('.browse-tab-close');
    if (closeBtn) {
      e.stopPropagation();
      const tabId = parseInt(closeBtn.dataset.tabId, 10);
      await closeTab(tabId);
      return;
    }

    // Close all tabs in domain
    const closeAllBtn = e.target.closest('.browse-domain-close-all');
    if (closeAllBtn) {
      e.stopPropagation();
      const domain = closeAllBtn.dataset.domain;
      await closeAllTabsInDomain(domain);
      return;
    }

    // Edit domain name button
    const editBtn = e.target.closest('.browse-domain-edit');
    if (editBtn) {
      e.stopPropagation();
      const domain = editBtn.dataset.domain;
      const currentName = editBtn.dataset.name;
      startDomainEdit(domain, currentName);
      return;
    }

    // Tab item click - switch to tab
    const tabItem = e.target.closest('.browse-tab-item');
    if (tabItem) {
      const tabId = parseInt(tabItem.dataset.tabId, 10);
      await switchToTab(tabId);
      return;
    }

    // Domain header click - toggle expand
    const domainHeader = e.target.closest('.browse-domain-header');
    if (domainHeader) {
      const group = domainHeader.closest('.browse-domain-group');
      const domain = group.dataset.domain;
      console.log('[Browse] Toggle domain:', domain);
      toggleDomainExpand(domain);
      return;
    }

    // Tab group header click - toggle expand
    const groupHeader = e.target.closest('.browse-tab-group-header');
    if (groupHeader) {
      const group = groupHeader.closest('.browse-tab-group');
      const groupId = parseInt(group.dataset.groupId, 10);
      toggleTabGroupExpand(groupId);
      return;
    }
  });
}

/**
 * Toggle domain group expand/collapse (set = collapsed)
 */
function toggleDomainExpand(domain) {
  // Now: set contains collapsed domains
  console.log('[Browse] Before toggle, expandedDomains:', [...expandedDomains]);
  if (expandedDomains.has(domain)) {
    expandedDomains.delete(domain); // expand it
    console.log('[Browse] Expanded domain:', domain);
  } else {
    expandedDomains.add(domain); // collapse it
    console.log('[Browse] Collapsed domain:', domain);
  }
  console.log('[Browse] After toggle, expandedDomains:', [...expandedDomains]);
  renderBrowseMode();
}

/**
 * Toggle tab group expand/collapse (set = collapsed)
 */
function toggleTabGroupExpand(groupId) {
  // Now: set contains collapsed groups
  if (expandedGroups.has(groupId)) {
    expandedGroups.delete(groupId); // expand it
  } else {
    expandedGroups.add(groupId); // collapse it
  }
  renderBrowseMode();
}

/**
 * Start editing a domain name (5.2)
 */
function startDomainEdit(domain, currentName) {
  const group = document.querySelector(`.browse-domain-group[data-domain="${CSS.escape(domain)}"]`);
  if (!group) return;

  const nameSpan = group.querySelector('.browse-domain-name');
  if (!nameSpan) return;

  // Create input element
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'browse-domain-name-input';
  input.value = currentName;
  input.dataset.domain = domain;
  input.dataset.originalName = currentName;

  // Replace span with input
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  // Handle keyboard events (5.4, 5.5)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveDomainEdit(domain, input.value.trim());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelDomainEdit(domain, input.dataset.originalName);
    }
  });

  // Handle blur (5.6) - save on click outside
  input.addEventListener('blur', () => {
    // Small delay to allow Enter/Escape to fire first
    setTimeout(() => {
      if (document.contains(input)) {
        saveDomainEdit(domain, input.value.trim());
      }
    }, 100);
  });
}

/**
 * Save domain name edit (5.3, 5.7)
 */
async function saveDomainEdit(domain, newName) {
  // Empty input = reset to default (5.7)
  if (!newName) {
    await removeCustomDomainName(domain);
  } else {
    await saveCustomDomainName(domain, newName);
  }

  // Re-render to show updated name (6.3)
  renderBrowseMode();
}

/**
 * Cancel domain name edit
 */
function cancelDomainEdit(domain, originalName) {
  // Simply re-render to restore original state
  renderBrowseMode();
}

/**
 * Close a single tab
 */
async function closeTab(tabId) {
  try {
    await chrome.tabs.remove(tabId);
    // Reload browse data and re-render
    await loadBrowseData();
    renderBrowseMode();
  } catch (error) {
    console.error('[Browse] Failed to close tab:', error);
  }
}

/**
 * Close all tabs in a domain
 */
async function closeAllTabsInDomain(domain) {
  try {
    const domainGroup = browseData.domains.find(d => d.domain === domain);
    if (!domainGroup) return;

    const tabIds = domainGroup.tabs.map(t => t.id);
    await chrome.tabs.remove(tabIds);

    // Reload browse data and re-render
    await loadBrowseData();
    renderBrowseMode();
  } catch (error) {
    console.error('[Browse] Failed to close domain tabs:', error);
  }
}

/**
 * Switch to a specific tab
 */
async function switchToTab(tabId) {
  try {
    await chrome.tabs.update(tabId, { active: true });
    const tab = await chrome.tabs.get(tabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    window.close();
  } catch (error) {
    console.error('[Browse] Failed to switch tab:', error);
  }
}

/**
 * Handle arrow key navigation in Browse Mode
 */
function handleBrowseNavigation(direction) {
  // Get all navigable items
  const items = document.querySelectorAll('.browse-domain-header, .browse-tab-group-header, .browse-tab-item');
  if (items.length === 0) return;

  // Update selection
  browseSelectedIndex += direction;
  if (browseSelectedIndex < 0) browseSelectedIndex = 0;
  if (browseSelectedIndex >= items.length) browseSelectedIndex = items.length - 1;

  // Update visual selection
  items.forEach((item, i) => {
    item.classList.toggle('selected', i === browseSelectedIndex);
  });

  // Scroll into view
  items[browseSelectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/**
 * Activate the currently selected item in Browse Mode
 */
async function activateBrowseSelection() {
  const selectedItem = document.querySelector('.browse-domain-header.selected, .browse-tab-group-header.selected, .browse-tab-item.selected');
  if (!selectedItem) return;

  if (selectedItem.classList.contains('browse-tab-item')) {
    const tabId = parseInt(selectedItem.dataset.tabId, 10);
    await switchToTab(tabId);
  } else if (selectedItem.classList.contains('browse-domain-header')) {
    const group = selectedItem.closest('.browse-domain-group');
    const domain = group.dataset.domain;
    toggleDomainExpand(domain);
  } else if (selectedItem.classList.contains('browse-tab-group-header')) {
    const group = selectedItem.closest('.browse-tab-group');
    const groupId = parseInt(group.dataset.groupId, 10);
    toggleTabGroupExpand(groupId);
  }
}

/**
 * Close the currently selected tab in Browse Mode
 */
async function closeBrowseSelectedTab() {
  const selectedItem = document.querySelector('.browse-tab-item.selected');
  if (!selectedItem) return;

  const tabId = parseInt(selectedItem.dataset.tabId, 10);
  await closeTab(tabId);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
