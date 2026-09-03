## 1. Core Logic

- [x] 1.1 Add `findDuplicateTabs(tabs)` function in `overlay.js` to detect duplicate URLs and return count + URLs list
- [x] 1.2 Add `deduplicateTabs()` function in `overlay.js` that uses `TabManager.closeDuplicateTabs()` to close duplicates

## 2. UI Integration

- [x] 2.1 Modify `renderBrowseMode()` to calculate and display duplicate count in stats area
- [x] 2.2 Add "Deduplicate" button to the Browse Mode stats bar (next to existing stats)
- [x] 2.3 Add click handler for the Deduplicate button that calls `deduplicateTabs()`

## 3. User Feedback

- [x] 3.1 Show toast notification after deduplication with count of closed tabs
- [x] 3.2 Refresh Browse Mode view after deduplication to reflect updated tab list

## 4. Styling

- [x] 4.1 Add CSS styles for the Deduplicate button (consistent with existing Browse Mode UI)
- [x] 4.2 Style the duplicate count indicator
