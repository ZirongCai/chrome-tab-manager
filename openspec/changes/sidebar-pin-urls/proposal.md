## Why

The user-pin-urls feature was added to the search overlay (Cmd+Shift+K), but the sidebar panel (Cmd+Shift+P) lacks this capability. Users who prefer the sidebar for tab management cannot pin their frequently accessed URLs there, creating an inconsistent experience between the two interfaces.

## What Changes

- Add a pin button to tab chips in the sidebar panel (visible on hover)
- Display pinned URLs in a dedicated "Pinned" section at the top of the sidebar
- Reuse the existing `userPinnedUrls` storage from search.js for consistency
- Allow users to pin/unpin URLs directly from the sidebar
- Sync pin state across both sidebar and search overlay (same storage)

## Capabilities

### New Capabilities
- `sidebar-url-pinning`: Adds pin/unpin functionality to the sidebar panel, including a dedicated Pinned section and pin buttons on tab chips

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **extension/sidepanel.js**: Add pin button rendering, click handlers, and Pinned section
- **extension/sidepanel.html**: Add Pinned section container
- **extension/sidepanel.css**: Add styles for pin button and Pinned section
- **Shared storage**: Uses existing `userPinnedUrls` key in Chrome storage (already implemented in search.js)
- **Cross-feature sync**: Pins made in sidebar appear in search overlay and vice versa
