## Why

Currently, pinned URLs are hardcoded in `extension/search.js`, requiring code changes to add new pinned entries. Users have frequently-used URLs they want quick access to, but they cannot customize which URLs appear at the top of search results. This feature enables users to pin their own URLs through the UI, making the extension more personalized and useful.

## What Changes

- Add a "pin" button/icon to search results that allows users to mark any URL as pinned
- Implement persistent storage for user-pinned URLs using Chrome's storage API
- Modify the search engine to merge user-pinned URLs with hardcoded pinned URLs
- Add visual indicator showing which URLs are user-pinned vs. built-in pinned
- Add ability to unpin previously pinned URLs

## Capabilities

### New Capabilities
- `user-url-pinning`: Allows users to manually pin/unpin URLs through the search overlay interface, with persistent storage and search integration

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **extension/search.js**: Add storage integration for user pins, merge with PINNED_URLS in search
- **extension/overlay.js**: Add pin/unpin button to result items, handle click events
- **extension/overlay.html**: Add styles for pin button and user-pinned badge variant
- **Chrome storage API**: New storage key for user-pinned URLs
- **Permissions**: May need to ensure "storage" permission is in manifest (likely already present)
