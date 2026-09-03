## 1. Create Constants File

- [x] 1.1 Create `extension/constants.js` with SEARCH_CONFIG (maxInitialItems, debounceDelay, maxHistoryDays, maxHistoryResults, fuseThreshold, fuseDistance)
- [x] 1.2 Add SCORE_WEIGHTS to constants.js (tab, bookmark, history multipliers; pin scores; match type scores; recency multipliers)
- [x] 1.3 Add BADGE_CONFIG to constants.js (thresholds and colors)
- [x] 1.4 Add TIMING to constants.js (toastDuration, toastFadeOut, tabGroupDelay)
- [x] 1.5 Add BROWSER_INTERNAL_PREFIXES, TLD_LIST, and STOP_WORDS to constants.js

## 2. Remove Dead Code from core.js

- [x] 2.1 Remove unused TextHelpers functions: parseGardenerUrl, getTabGroupKey, getSmartGroupName, stripTitleNoise, cleanTitle, smartTitle, timeAgo, getGreeting, getDateDisplay
- [x] 2.2 Remove unused ICONS entries: close, archive, focus, folder, search, expand, chevron, history
- [x] 2.3 Remove unused BookmarkManager.searchBookmarks function

## 3. Remove Dead Code from overlay.js

- [x] 3.1 Remove unused local highlightMatch function (line ~900)
- [x] 3.2 Remove shadowed isUserPinned import (keep local function)

## 4. Remove Duplicate Code

- [x] 4.1 Remove duplicate generateKeywords from background.js (keep search.js version)
- [x] 4.2 Remove duplicate getGroupColor from overlay.js, import from core.js instead
- [x] 4.3 Remove duplicate escapeHtml from overlay.js and search.js, add to core.js and import
- [x] 4.4 Consolidate cleanHostname logic: use core.js friendlyDomain, remove overlay.js cleanHostname

## 5. Update Imports to Use Constants

- [x] 5.1 Update search.js to import and use SEARCH_CONFIG, SCORE_WEIGHTS, STOP_WORDS from constants.js
- [x] 5.2 Update overlay.js to import MAX_INITIAL_ITEMS from SEARCH_CONFIG, TIMING for toast
- [x] 5.3 Update background.js to import BADGE_CONFIG, TIMING, BROWSER_INTERNAL_PREFIXES from constants.js
- [x] 5.4 Update core.js to import TLD_LIST, BROWSER_INTERNAL_PREFIXES from constants.js

## 6. Verification

- [x] 6.1 Verify extension loads without errors in Chrome
- [x] 6.2 Verify search functionality works (fuzzy search, scoring, collapse)
- [x] 6.3 Verify browse mode works (domain groups, tab groups)
- [x] 6.4 Verify pin functionality works (add, remove, custom names)
- [x] 6.5 Verify badge colors update correctly based on tab count
