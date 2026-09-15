## Why

Users currently need to open the overlay and type in the search box to find tabs. There's no quick way to search specifically among open tabs, and Browse Mode lacks any filtering capability, making it difficult to find specific tabs when many are open.

## What Changes

- Add a `/tabs` command in the search overlay's command mode (type `/` then select `tabs`) to search only open tabs
- Add a Chrome keyboard shortcut (Cmd+Shift+T) that opens the overlay in tabs-only mode directly  
- Add a search/filter input to Browse Mode that filters the displayed tab list in real-time
- The search functionality reuses the existing Fuse.js fuzzy search infrastructure

## Capabilities

### New Capabilities
- `tab-search-command`: `/tabs` command in the search overlay for searching open tabs only, plus keyboard shortcut for direct access
- `browse-mode-filter`: Real-time filter input in Browse Mode to filter displayed tabs by title/URL

### Modified Capabilities
None - the existing fuzzy-search capability remains unchanged; we're adding new entry points that use it.

## Impact

- `manifest.json`: New command registration for "search-open-tabs" keyboard shortcut
- `background.js`: Handler for the keyboard shortcut
- `overlay.js`: `/tabs` command implementation, Browse Mode filter UI and logic
- `overlay.html`: Filter input element styling, tabs-only indicator styling
