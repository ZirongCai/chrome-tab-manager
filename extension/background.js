/**
 * background.js — Service Worker for Badge Updates
 *
 * Chrome's "always-on" background script for Tab Out.
 * Its only job: keep the toolbar badge showing the current open tab count.
 *
 * Since we no longer have a server, we query chrome.tabs directly.
 * The badge counts real web tabs (skipping chrome:// and extension pages).
 *
 * Color coding gives a quick at-a-glance health signal:
 *   Green  (#3d7a4a) → 1–10 tabs  (focused, manageable)
 *   Amber  (#b8892e) → 11–20 tabs (getting busy)
 *   Red    (#b35a5a) → 21+ tabs   (time to cull!)
 */

import { BADGE_CONFIG, TIMING, BROWSER_INTERNAL_PREFIXES } from './constants.js';

// ─── User Pins Storage ───────────────────────────────────────────────────────

const USER_PINS_STORAGE_KEY = 'userPinnedUrls';

/**
 * Load user-pinned URLs from Chrome storage
 */
async function loadUserPins() {
  try {
    const result = await chrome.storage.local.get(USER_PINS_STORAGE_KEY);
    return result[USER_PINS_STORAGE_KEY] || [];
  } catch (error) {
    console.error('[Background] Failed to load user pins:', error);
    return [];
  }
}

/**
 * Save user-pinned URLs to Chrome storage
 */
async function saveUserPins(pins) {
  try {
    await chrome.storage.local.set({ [USER_PINS_STORAGE_KEY]: pins });
  } catch (error) {
    console.error('[Background] Failed to save user pins:', error);
  }
}

/**
 * Generate keywords from URL and title
 * Simplified version for background.js - full version is in search.js
 */
function generateKeywords(url, title) {
  const keywords = new Set();
  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.split('.');
    for (const part of hostParts) {
      if (part.length > 2) keywords.add(part.toLowerCase());
    }
  } catch {}
  if (title) {
    const titleWords = title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
      if (word.length > 2) keywords.add(word);
    }
  }
  return Array.from(keywords);
}

/**
 * Add a URL to user pins
 */
async function addUserPin(url, title) {
  try {
    const pins = await loadUserPins();
    if (pins.some(p => p.url === url)) {
      return false; // Already pinned
    }
    const keywords = generateKeywords(url, title);
    pins.push({ url, title, keywords, pinnedAt: Date.now() });
    await saveUserPins(pins);
    return true;
  } catch (error) {
    console.error('[Background] Failed to add user pin:', error);
    return false;
  }
}

/**
 * Remove a URL from user pins
 */
async function removeUserPin(url) {
  try {
    const pins = await loadUserPins();
    const filteredPins = pins.filter(p => p.url !== url);
    if (filteredPins.length === pins.length) {
      return false; // Was not pinned
    }
    await saveUserPins(filteredPins);
    return true;
  } catch (error) {
    console.error('[Background] Failed to remove user pin:', error);
    return false;
  }
}

/**
 * Check if a URL is pinned
 */
async function isUrlPinned(url) {
  const pins = await loadUserPins();
  return pins.some(p => p.url === url);
}

/**
 * Show a toast notification on the current page
 */
async function showPinFeedback(isPinned, pageTitle, tabId) {
  const shortTitle = pageTitle && pageTitle.length > 40
    ? pageTitle.substring(0, 40) + '...'
    : (pageTitle || 'Page');

  const message = isPinned
    ? `📌 Pinned: ${shortTitle}`
    : `✓ Unpinned: ${shortTitle}`;

  // Toast timing values to pass into the injected script
  const toastDuration = TIMING.toastDuration - TIMING.toastFadeOut;
  const toastFadeOut = TIMING.toastFadeOut;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (msg, duration, fadeOut) => {
        // Remove existing toast if any
        const existing = document.getElementById('tab-manager-toast');
        if (existing) existing.remove();

        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'tab-manager-toast';
        toast.textContent = msg;
        toast.style.cssText = `
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: #1a1a1a;
          color: #fff;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          z-index: 2147483647;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        `;
        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
          toast.style.opacity = '1';
          toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after duration
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(-50%) translateY(10px)';
          setTimeout(() => toast.remove(), fadeOut);
        }, duration);
      },
      args: [message, toastDuration, toastFadeOut]
    });
  } catch (error) {
    // Fallback to console log if script injection fails (e.g., on chrome:// pages)
    console.log('[Background] Toast fallback:', message);
  }
}

// ─── Badge updater ────────────────────────────────────────────────────────────

/**
 * Check if URL is a browser internal page
 */
function isInternalUrl(url) {
  return BROWSER_INTERNAL_PREFIXES.some(prefix => url.startsWith(prefix));
}

/**
 * updateBadge()
 *
 * Counts open real-web tabs and updates the extension's toolbar badge.
 * "Real" tabs = not chrome://, not extension pages, not about:blank.
 */
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});

    // Only count actual web pages — skip browser internals and extension pages
    const count = tabs.filter(t => {
      const url = t.url || '';
      return !isInternalUrl(url);
    }).length;

    // Don't show "0" — an empty badge is cleaner
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });

    if (count === 0) return;

    // Pick badge color based on workload level
    let color;
    if (count <= BADGE_CONFIG.thresholds.low) {
      color = BADGE_CONFIG.colors.low;    // Green — you're in control
    } else if (count <= BADGE_CONFIG.thresholds.medium) {
      color = BADGE_CONFIG.colors.medium; // Amber — things are piling up
    } else {
      color = BADGE_CONFIG.colors.high;   // Red — time to focus and close some tabs
    }

    await chrome.action.setBadgeBackgroundColor({ color });

  } catch {
    // If something goes wrong, clear the badge rather than show stale data
    chrome.action.setBadgeText({ text: '' });
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

// Update badge when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

// Update badge when Chrome starts up
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Update badge whenever a tab is opened
chrome.tabs.onCreated.addListener(async (tab) => {
  updateBadge();

  // Auto-add to focused group if one is set
  try {
    const { focusedGroupId } = await chrome.storage.local.get('focusedGroupId');
    if (focusedGroupId && tab.id) {
      // Verify the group still exists before trying to add
      try {
        const group = await chrome.tabGroups.get(focusedGroupId);
        if (group) {
          // Wait a bit for the tab to be fully created
          setTimeout(async () => {
            try {
              await chrome.tabs.group({ tabIds: [tab.id], groupId: focusedGroupId });
            } catch (error) {
              // Clear invalid group ID
              await chrome.storage.local.remove('focusedGroupId');
            }
          }, TIMING.tabGroupDelay);
        }
      } catch (error) {
        // Group doesn't exist anymore, clear it
        await chrome.storage.local.remove('focusedGroupId');
      }
    }
  } catch (error) {
    // Silently fail
  }
});

// Update badge whenever a tab is closed
chrome.tabs.onRemoved.addListener(() => {
  updateBadge();
});

// Update badge when a tab's URL changes (e.g. navigating to/from chrome://)
chrome.tabs.onUpdated.addListener(() => {
  updateBadge();
});

// ─── Initial run ─────────────────────────────────────────────────────────────

// Run once immediately when the service worker first loads
updateBadge();

// ─── Keyboard shortcuts ──────────────────────────────────────────────────────

/**
 * Handle keyboard shortcuts from manifest commands
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-search') {
    try {
      // Open search overlay in a new tab
      const extensionId = chrome.runtime.id;
      const url = `chrome-extension://${extensionId}/overlay.html`;
      await chrome.tabs.create({ url });
    } catch (error) {
      // Silently fail
    }
  } else if (command === 'pin-current-page') {
    try {
      // Get the current active tab
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url) {
        console.log('[Background] No active tab to pin');
        return;
      }

      // Skip chrome:// and extension pages
      if (activeTab.url.startsWith('chrome://') ||
          activeTab.url.startsWith('chrome-extension://') ||
          activeTab.url.startsWith('about:')) {
        console.log('[Background] Cannot pin browser internal page');
        return;
      }

      const url = activeTab.url;
      const title = activeTab.title || url;

      // Toggle pin status
      const isPinned = await isUrlPinned(url);
      if (isPinned) {
        await removeUserPin(url);
        console.log('[Background] Unpinned:', title);
        await showPinFeedback(false, title, activeTab.id);
      } else {
        await addUserPin(url, title);
        console.log('[Background] Pinned:', title);
        await showPinFeedback(true, title, activeTab.id);
      }
    } catch (error) {
      console.error('[Background] Error in pin-current-page command:', error);
    }
    } else if (command === 'search-open-tabs') {
    try {
      // Open search overlay in tabs-only mode
      const extensionId = chrome.runtime.id;
      const url = `chrome-extension://${extensionId}/overlay.html?searchTabsOnly=true`;
      await chrome.tabs.create({ url });
    } catch (error) {
      // Silently fail
    }
  } else if (command === 'create-new-group') {
    try {
      console.log('[Background] create-new-group command triggered');

      // Then create the group
      const allGroups = await chrome.tabGroups.query({});
      const allColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
      const usedColors = allGroups.map(g => g.color || 'grey');
      const availableColors = allColors.filter(c => !usedColors.includes(c));
      const selectedColor = availableColors.length > 0 ? availableColors[0] : allColors[Math.floor(Math.random() * allColors.length)];

      // Open search overlay in a new tab
      const extensionId = chrome.runtime.id;
      const searchUrl = `chrome-extension://${extensionId}/overlay.html`;
      const newTab = await chrome.tabs.create({ url: searchUrl });
      console.log('[Background] Created overlay tab:', newTab.id);

      // Create group immediately
      const groupId = await chrome.tabs.group({ tabIds: [newTab.id] });
      console.log('[Background] Created group:', groupId);

      // Set the color
      await chrome.tabGroups.update(groupId, {
        color: selectedColor,
        collapsed: false
      });

      // Auto-focus the new group
      await chrome.storage.local.set({ focusedGroupId: groupId });

      // Store pending group name request
      await chrome.storage.local.set({
        pendingGroupNamePrompt: {
          groupId: groupId,
          timestamp: Date.now()
        }
      });
      console.log('[Background] Stored pending group name prompt for group:', groupId);
    } catch (error) {
      console.error('[Background] Error in create-new-group command:', error);
    }
  }
});

// Handle extension icon click - open overlay
chrome.action.onClicked.addListener(async () => {
  try {
    const extensionId = chrome.runtime.id;
    const url = `chrome-extension://${extensionId}/overlay.html`;
    await chrome.tabs.create({ url });
  } catch (error) {
    // Silently fail
  }
});
