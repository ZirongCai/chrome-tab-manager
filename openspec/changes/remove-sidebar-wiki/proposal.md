## Why

The sidebar panel and dedicated wiki search features have proven to be underutilized compared to the new Browse Mode and integrated search functionality. Removing these reduces code complexity while preserving the extensible command system (`/wiki`, etc.) for future commands.

## What Changes

- **BREAKING**: Remove sidebar panel feature entirely (`sidepanel.html`, `sidepanel.js`, `sidepanel.css`)
- **BREAKING**: Remove wiki search integration from overlay (but preserve the `/wiki` command entry point as a stub)
- Remove wiki-related files (`wiki-search.js`, `wiki-index.md`) from active use
- Update manifest.json to remove sidePanel permission and configuration
- Maintain command mode infrastructure in overlay.js for future extensibility

## Capabilities

### New Capabilities
- `command-mode-extensible`: Preserve and document the `/` command system in overlay.js as an extensible framework for future commands

### Modified Capabilities
- None (this is primarily a removal, not a modification of existing specs)

## Impact

- **Files to remove**: `sidepanel.html`, `sidepanel.js`, `sidepanel.css`, `wiki-search.js`
- **Files to modify**: `manifest.json` (remove sidePanel config), `overlay.js` (remove wiki integration, keep command framework), `background.js` (remove sidebar-related commands)
- **Commands affected**: `Cmd+Shift+P` (open-side-panel) will be removed
- **User impact**: Users who relied on sidebar for tab management should use Browse Mode instead; wiki search via `/wiki` command will show a "feature removed" message or can be repurposed
