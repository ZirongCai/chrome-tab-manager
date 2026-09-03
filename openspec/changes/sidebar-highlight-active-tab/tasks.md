## 1. Track Active Tab

- [x] 1.1 Add `activeTabId` module-level variable to store current active tab ID
- [x] 1.2 Query active tab on sidebar initialization and store the ID
- [x] 1.3 Add `chrome.tabs.onActivated` listener to update `activeTabId` when tab changes

## 2. Visual Highlight

- [x] 2.1 Add `.tab-chip.active` CSS class with highlight styles (left border, background tint)
- [x] 2.2 Modify `renderTabChip()` to add `active` class when tab ID matches `activeTabId`

## 3. Auto-expand and Scroll

- [x] 3.1 Create `highlightActiveTab()` function that finds and highlights the active tab chip
- [x] 3.2 Auto-expand parent domain folder if the active tab is in a collapsed folder
- [x] 3.3 Scroll the active tab chip into view after rendering
- [x] 3.4 Call `highlightActiveTab()` after `loadTabs()` completes

## 4. Testing

- [ ] 4.1 Test active tab is highlighted on sidebar open
- [ ] 4.2 Test highlight updates when switching tabs
- [ ] 4.3 Test collapsed folder auto-expands to show active tab
- [ ] 4.4 Test active tab scrolls into view

> **Note:** Section 4 contains manual testing tasks.
