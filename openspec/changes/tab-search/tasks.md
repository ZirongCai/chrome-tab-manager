## 1. Tab Search Command

- [x] 1.1 Add `search-open-tabs` command to manifest.json with keyboard shortcut (Cmd+Shift+T or available alternative)
- [x] 1.2 Add command handler in background.js to open overlay with `searchTabsOnly=true` URL param
- [x] 1.3 Update overlay.js to parse URL params and initialize tabs-only mode on load
- [x] 1.4 Add `searchTabsOnly()` method to UnifiedSearch class (or filter existing search results)
- [x] 1.5 Add visual indicator in overlay.html/CSS for tabs-only mode (badge or placeholder text)
- [x] 1.6 Add "Search all" toggle/button to switch from tabs-only to unified search

## 2. Browse Mode Filter

- [x] 2.1 Add filter input HTML element to overlay.html in the Browse Mode header area
- [x] 2.2 Style filter input to match existing design (constants.js colors, border styles)
- [x] 2.3 Create BrowseModeFilter class or function in overlay.js with Fuse.js instance for tabs
- [x] 2.4 Wire up filter input event listener with debounce (100-150ms)
- [x] 2.5 Implement filter logic that hides non-matching tabs while preserving group structure
- [x] 2.6 Add match count display ("X of Y tabs") when filter is active
- [x] 2.7 Handle Escape key to clear filter (and close overlay if already empty)
- [x] 2.8 Clear filter state when switching between Browse Mode and Search Mode

## 3. Testing & Polish

- [x] 3.1 Test tab search command with various keyboard shortcut combinations
- [x] 3.2 Test Browse Mode filter with many tabs (100+) for performance
- [x] 3.3 Test fuzzy matching edge cases (typos, partial matches, special characters)
- [x] 3.4 Verify filter clears properly on mode switches and overlay close/reopen
