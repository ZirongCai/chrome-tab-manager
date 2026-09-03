/* ================================================================
   Tab Out — Core Module (Shared between side panel and expanded view)

   This module exports all reusable logic for both the side panel
   and the full expanded view. Keeps code DRY while maintaining
   the vanilla JS philosophy (no build tools).

   Exports:
   - TabManager: Tab operations (fetch, close, focus, group)
   - TabGroupManager: Tab Group operations (fetch, create, update)
   - BookmarkManager: Bookmark operations (fetch tree, flatten)
   - DOMHelpers: UI helpers (confetti, sound, toast, animations)
   - TextHelpers: Text processing (domain names, title cleaning)
   - StorageHelpers: chrome.storage.local operations
   - ICONS: SVG icon strings
   ================================================================ */

'use strict';

import { FRIENDLY_DOMAINS, URL_PATTERN_NAMES } from './domain-names.js';
import { BROWSER_INTERNAL_PREFIXES, TLD_LIST, TAB_GROUP_COLORS } from './constants.js';

/* ----------------------------------------------------------------
   TAB MANAGER
   ---------------------------------------------------------------- */

export const TabManager = {
  /**
   * fetchOpenTabs()
   * Returns all currently open browser tabs
   */
  async fetchOpenTabs() {
    try {
      const extensionId = chrome.runtime.id;
      const newtabUrl = `chrome-extension://${extensionId}/index.html`;
      const overlayUrl = `chrome-extension://${extensionId}/overlay.html`;

      const tabs = await chrome.tabs.query({});
      return tabs.map(t => ({
        id:       t.id,
        url:      t.url,
        title:    t.title,
        windowId: t.windowId,
        active:   t.active,
        groupId:  t.groupId || -1, // -1 means ungrouped
        favIconUrl: t.favIconUrl || '', // Browser's actual favicon
        isTabOut: t.url === newtabUrl || t.url === overlayUrl || t.url === 'chrome://newtab/',
      }));
    } catch (error) {
      console.error('[TabManager] fetchOpenTabs failed:', error);
      return [];
    }
  },

  /**
   * getRealTabs(tabs)
   * Filters out browser-internal pages
   */
  getRealTabs(tabs) {
    return tabs.filter(t => {
      const url = t.url || '';
      return !BROWSER_INTERNAL_PREFIXES.some(prefix => url.startsWith(prefix));
    });
  },

  /**
   * closeTabsByUrls(urls)
   * Closes tabs by hostname match (or exact match for file:// URLs)
   */
  async closeTabsByUrls(urls) {
    if (!urls || urls.length === 0) return;

    const targetHostnames = [];
    const exactUrls = new Set();

    for (const u of urls) {
      if (u.startsWith('file://')) {
        exactUrls.add(u);
      } else {
        try { targetHostnames.push(new URL(u).hostname); }
        catch { /* skip unparseable */ }
      }
    }

    const allTabs = await chrome.tabs.query({});
    const toClose = allTabs
      .filter(tab => {
        const tabUrl = tab.url || '';
        if (tabUrl.startsWith('file://') && exactUrls.has(tabUrl)) return true;
        try {
          const tabHostname = new URL(tabUrl).hostname;
          return tabHostname && targetHostnames.includes(tabHostname);
        } catch { return false; }
      })
      .map(tab => tab.id);

    if (toClose.length > 0) await chrome.tabs.remove(toClose);
  },

  /**
   * closeTabsExact(urls)
   * Closes tabs by exact URL match
   */
  async closeTabsExact(urls) {
    if (!urls || urls.length === 0) return;
    const urlSet = new Set(urls);
    const allTabs = await chrome.tabs.query({});
    const toClose = allTabs.filter(t => urlSet.has(t.url)).map(t => t.id);
    if (toClose.length > 0) await chrome.tabs.remove(toClose);
  },

  /**
   * focusTab(url)
   * Switches to the tab with the given URL and brings window to front
   */
  async focusTab(url) {
    if (!url) return;
    const allTabs = await chrome.tabs.query({});
    const currentWindow = await chrome.windows.getCurrent();

    // Try exact URL match first
    let matches = allTabs.filter(t => t.url === url);

    // Fall back to hostname match
    if (matches.length === 0) {
      try {
        const targetHost = new URL(url).hostname;
        matches = allTabs.filter(t => {
          try { return new URL(t.url).hostname === targetHost; }
          catch { return false; }
        });
      } catch {}
    }

    if (matches.length === 0) return;

    // Prefer a match in a different window
    const match = matches.find(t => t.windowId !== currentWindow.id) || matches[0];
    await chrome.tabs.update(match.id, { active: true });
    await chrome.windows.update(match.windowId, { focused: true });
  },

  /**
   * closeDuplicateTabs(urls, keepOne)
   * Closes duplicate tabs for the given URLs
   */
  async closeDuplicateTabs(urls, keepOne = true) {
    const allTabs = await chrome.tabs.query({});
    const toClose = [];

    for (const url of urls) {
      const matching = allTabs.filter(t => t.url === url);
      if (keepOne) {
        const keep = matching.find(t => t.active) || matching[0];
        for (const tab of matching) {
          if (tab.id !== keep.id) toClose.push(tab.id);
        }
      } else {
        for (const tab of matching) toClose.push(tab.id);
      }
    }

    if (toClose.length > 0) await chrome.tabs.remove(toClose);
  },

  /**
   * groupTabsByDomain(tabs, customGroups)
   * Groups tabs by domain/hostname
   */
  groupTabsByDomain(tabs, customGroups = []) {
    const groups = new Map();

    for (const tab of tabs) {
      let hostname = '';
      try { hostname = new URL(tab.url).hostname; }
      catch { hostname = 'local-files'; }

      // Check if this tab matches any custom grouping rules
      let groupKey = hostname;
      for (const rule of customGroups) {
        if (rule.test && rule.test(tab.url)) {
          groupKey = rule.label || hostname;
          break;
        }
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          domain: hostname,
          label: groupKey,
          tabs: []
        });
      }
      groups.get(groupKey).tabs.push(tab);
    }

    return Array.from(groups.values());
  },
};

/* ----------------------------------------------------------------
   TAB GROUP MANAGER (Chrome 89+)
   ---------------------------------------------------------------- */

export const TabGroupManager = {
  /**
   * fetchGroups()
   * Returns all Tab Groups
   */
  async fetchGroups() {
    try {
      if (!chrome.tabGroups) {
        console.warn('[TabGroupManager] Tab Groups API not available');
        return [];
      }
      const groups = await chrome.tabGroups.query({});
      return groups;
    } catch (error) {
      console.error('[TabGroupManager] fetchGroups failed:', error);
      return [];
    }
  },

  /**
   * createGroup(tabIds, title, color)
   * Creates a new Tab Group
   */
  async createGroup(tabIds, title = '', color = 'grey') {
    try {
      if (!chrome.tabGroups) return null;

      // Group the tabs first
      const groupId = await chrome.tabs.group({ tabIds });

      // Update group properties
      await chrome.tabGroups.update(groupId, {
        title: title || 'New Group',
        color: color,
        collapsed: false,
      });

      return groupId;
    } catch (error) {
      console.error('[TabGroupManager] createGroup failed:', error);
      return null;
    }
  },

  /**
   * addTabToGroup(tabId, groupId)
   * Adds a tab to an existing group
   */
  async addTabToGroup(tabId, groupId) {
    try {
      if (!chrome.tabGroups) return false;
      await chrome.tabs.group({ tabIds: [tabId], groupId });
      return true;
    } catch (error) {
      console.error('[TabGroupManager] addTabToGroup failed:', error);
      return false;
    }
  },

  /**
   * updateGroup(groupId, properties)
   * Updates group properties (title, color, collapsed)
   */
  async updateGroup(groupId, properties) {
    try {
      if (!chrome.tabGroups) return false;
      await chrome.tabGroups.update(groupId, properties);
      return true;
    } catch (error) {
      console.error('[TabGroupManager] updateGroup failed:', error);
      return false;
    }
  },

  /**
   * ungroupTabs(tabIds)
   * Removes tabs from their groups
   */
  async ungroupTabs(tabIds) {
    try {
      await chrome.tabs.ungroup(tabIds);
      return true;
    } catch (error) {
      console.error('[TabGroupManager] ungroupTabs failed:', error);
      return false;
    }
  },

  /**
   * getGroupColor(colorName)
   * Returns CSS color for Chrome's group colors
   */
  getGroupColor(colorName) {
    return TAB_GROUP_COLORS[colorName] || TAB_GROUP_COLORS['grey'];
  },
};

/* ----------------------------------------------------------------
   BOOKMARK MANAGER
   ---------------------------------------------------------------- */

export const BookmarkManager = {
  /**
   * fetchTree()
   * Returns the complete bookmark tree
   */
  async fetchTree() {
    try {
      const tree = await chrome.bookmarks.getTree();
      return tree[0]; // Root node
    } catch (error) {
      console.error('[BookmarkManager] fetchTree failed:', error);
      return null;
    }
  },

  /**
   * flattenTree(node, depth, parentTitle)
   * Flattens bookmark tree for search, includes parent folder name
   */
  flattenTree(node, depth = 0, parentTitle = '') {
    const results = [];

    if (node.url) {
      // It's a bookmark
      results.push({
        id: node.id,
        title: node.title,
        url: node.url,
        type: 'bookmark',
        depth: depth,
        parentTitle: parentTitle, // Parent folder name
      });
    } else if (node.children) {
      // It's a folder
      const folderTitle = node.title || '';

      if (folderTitle) { // Skip root folders
        results.push({
          id: node.id,
          title: folderTitle,
          type: 'folder',
          depth: depth,
        });
      }

      // Pass current folder title as parent for children
      const nextParent = folderTitle || parentTitle;
      for (const child of node.children) {
        results.push(...this.flattenTree(child, depth + 1, nextParent));
      }
    }

    return results;
  },

  /**
   * searchBookmarks(query)
   * Searches bookmarks by title or URL
   * Note: Currently unused - search is done via Fuse.js in search.js
   * Keeping for potential future use
   */
  async searchBookmarks(query) {
    try {
      const results = await chrome.bookmarks.search(query);
      return results;
    } catch (error) {
      console.error('[BookmarkManager] searchBookmarks failed:', error);
      return [];
    }
  },
};

/* ----------------------------------------------------------------
   STORAGE HELPERS
   ---------------------------------------------------------------- */

export const StorageHelpers = {
  /**
   * getFolderStates()
   * Returns bookmark folder expand/collapse states
   */
  async getFolderStates() {
    const { folderStates = {} } = await chrome.storage.local.get('folderStates');
    return folderStates;
  },

  /**
   * setFolderState(folderId, state)
   * Saves folder expand/collapse state
   */
  async setFolderState(folderId, state) {
    const { folderStates = {} } = await chrome.storage.local.get('folderStates');
    folderStates[folderId] = state;
    await chrome.storage.local.set({ folderStates });
  },

  /**
   * getBookmarksSectionCollapsed()
   * Returns whether the entire bookmarks section is collapsed
   */
  async getBookmarksSectionCollapsed() {
    const { bookmarksSectionCollapsed = false } = await chrome.storage.local.get('bookmarksSectionCollapsed');
    return bookmarksSectionCollapsed;
  },

  /**
   * setBookmarksSectionCollapsed(collapsed)
   * Saves bookmarks section collapsed state
   */
  async setBookmarksSectionCollapsed(collapsed) {
    await chrome.storage.local.set({ bookmarksSectionCollapsed: collapsed });
  },

  /**
   * getGroupsSectionCollapsed()
   * Returns whether the entire groups section is collapsed
   */
  async getGroupsSectionCollapsed() {
    const { groupsSectionCollapsed = false } = await chrome.storage.local.get('groupsSectionCollapsed');
    return groupsSectionCollapsed;
  },

  /**
   * setGroupsSectionCollapsed(collapsed)
   * Saves groups section collapsed state
   */
  async setGroupsSectionCollapsed(collapsed) {
    await chrome.storage.local.set({ groupsSectionCollapsed: collapsed });
  },

  /**
   * getFocusedGroupId()
   * Returns the currently focused group ID
   */
  async getFocusedGroupId() {
    const { focusedGroupId = null } = await chrome.storage.local.get('focusedGroupId');
    return focusedGroupId;
  },

  /**
   * setFocusedGroupId(groupId)
   * Saves the focused group ID
   */
  async setFocusedGroupId(groupId) {
    await chrome.storage.local.set({ focusedGroupId: groupId });
  },

  /**
   * clearFocusedGroupId()
   * Clears the focused group ID
   */
  async clearFocusedGroupId() {
    await chrome.storage.local.remove('focusedGroupId');
  },

  /**
   * getCurrentActiveGroupId()
   * Returns the currently active Tab Group ID
   */
  async getCurrentActiveGroupId() {
    const { currentActiveGroupId = null } = await chrome.storage.local.get('currentActiveGroupId');
    return currentActiveGroupId;
  },

  /**
   * setCurrentActiveGroupId(groupId)
   * Saves current active Tab Group ID
   */
  async setCurrentActiveGroupId(groupId) {
    await chrome.storage.local.set({ currentActiveGroupId: groupId });
  },

  /**
   * getGroupCollapsedStates()
   * Returns Tab Group collapsed states
   */
  async getGroupCollapsedStates() {
    const { groupCollapsedStates = {} } = await chrome.storage.local.get('groupCollapsedStates');
    return groupCollapsedStates;
  },

  /**
   * setGroupCollapsedState(groupId, collapsed)
   * Saves Tab Group collapsed state
   */
  async setGroupCollapsedState(groupId, collapsed) {
    const { groupCollapsedStates = {} } = await chrome.storage.local.get('groupCollapsedStates');
    groupCollapsedStates[groupId] = collapsed;
    await chrome.storage.local.set({ groupCollapsedStates });
  },

  /**
   * getDomainCollapsedStates()
   * Returns domain folder collapsed states for Open Tabs section
   */
  async getDomainCollapsedStates() {
    const { domainCollapsedStates = {} } = await chrome.storage.local.get('domainCollapsedStates');
    return domainCollapsedStates;
  },

  /**
   * setDomainCollapsedState(domain, collapsed)
   * Saves domain folder collapsed state
   */
  async setDomainCollapsedState(domain, collapsed) {
    const { domainCollapsedStates = {} } = await chrome.storage.local.get('domainCollapsedStates');
    domainCollapsedStates[domain] = collapsed;
    await chrome.storage.local.set({ domainCollapsedStates });
  },
};

/* ----------------------------------------------------------------
   TEXT HELPERS
   ---------------------------------------------------------------- */

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const TextHelpers = {
  /**
   * friendlyDomain(hostname)
   * Converts hostname to friendly display name
   */
  friendlyDomain(hostname) {
    if (!hostname) return '';
    if (FRIENDLY_DOMAINS[hostname]) return FRIENDLY_DOMAINS[hostname];

    if (hostname.endsWith('.substack.com') && hostname !== 'substack.com') {
      return capitalize(hostname.replace('.substack.com', '')) + "'s Substack";
    }
    if (hostname.endsWith('.github.io')) {
      return capitalize(hostname.replace('.github.io', '')) + ' (GitHub Pages)';
    }

    // Build TLD regex from constants
    const tldPattern = TLD_LIST.map(tld => tld.replace('.', '\\.')).join('|');
    const tldRegex = new RegExp(`\\.(${tldPattern})$`);

    let clean = hostname
      .replace(/^www\./, '')
      .replace(tldRegex, '');

    return clean.split('.').map(part => capitalize(part)).join(' ');
  },

};

/* ----------------------------------------------------------------
   DOM HELPERS
   ---------------------------------------------------------------- */

export const DOMHelpers = {
  /**
   * showToast(message)
   * Brief notification at bottom of screen
   */
  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const toastText = document.getElementById('toastText');
    if (toastText) toastText.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
  },

  /**
   * escapeHtml(text)
   * Escapes HTML special characters to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

/* ----------------------------------------------------------------
   SVG ICONS
   Only includes icons actually used in the codebase
   ---------------------------------------------------------------- */

export const ICONS = {
  tabs:     `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25m-18 0V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25m-18 0h18" /></svg>`,
  bookmark: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg>`,
  history:  `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
};
