## Why

When opening the sidebar (Cmd+Shift+P), users cannot easily locate which tab they are currently viewing among potentially dozens of tabs. This makes it hard to find and pin the current tab. Highlighting the active tab provides immediate visual feedback about the user's current location.

## What Changes

- Highlight the currently active tab in the sidebar with a distinct visual style
- Auto-expand the domain folder containing the active tab so it's visible
- Scroll the active tab into view when the sidebar opens
- Update highlighting when the user switches tabs

## Capabilities

### New Capabilities
- `sidebar-active-tab-highlight`: Visually highlights the currently active browser tab in the sidebar and ensures it's visible

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **extension/sidepanel.js**: Track active tab, update highlighting on tab changes, auto-expand and scroll
- **extension/sidepanel.css**: Add active tab highlight styles
- **Chrome tabs API**: Use `chrome.tabs.query({active: true})` to identify the active tab
