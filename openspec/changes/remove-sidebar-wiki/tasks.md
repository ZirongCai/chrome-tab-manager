## 1. Remove Sidebar Files

- [x] 1.1 Delete `sidepanel.html`
- [x] 1.2 Delete `sidepanel.js`
- [x] 1.3 Delete `sidepanel.css`

## 2. Remove Wiki Files

- [x] 2.1 Delete `wiki-search.js`
- [x] 2.2 Delete `wiki-index.md` (or keep as reference data if needed elsewhere)

## 3. Update Manifest

- [x] 3.1 Remove `sidePanel` permission from `permissions` array
- [x] 3.2 Remove `side_panel` configuration block
- [x] 3.3 Remove `open-side-panel` command from `commands`
- [x] 3.4 Remove `host_permissions` for wiki.one.int.sap
- [x] 3.5 Remove `web_accessible_resources` for wiki-index.md

## 4. Update Background Script

- [x] 4.1 Remove sidebar-related command handler (`open-side-panel`) from `background.js`
- [x] 4.2 Remove `sidePanel.open` calls, update icon click to open overlay

## 5. Update Overlay Script

- [x] 5.1 Remove `WikiIndexSearch` import and initialization from `overlay.js`
- [x] 5.2 Remove wiki command handler from command mode
- [x] 5.3 Keep command mode infrastructure (`/` detection, command routing)
- [x] 5.4 Add placeholder message for removed commands (e.g., "/wiki has been removed")

## 6. Cleanup Core Module

- [x] 6.1 Review `core.js` for any sidebar-specific exports and remove if unused
- [x] 6.2 Verify no remaining imports of deleted files

## 7. Testing

- [x] 7.1 Verify `Cmd+Shift+K` still opens overlay correctly
- [x] 7.2 Verify Browse Mode works (Tab key in empty search)
- [x] 7.3 Verify `/` command mode shows no active commands (or placeholder)
- [x] 7.4 Verify extension loads without console errors

All tasks complete. Syntax checks passed on all JavaScript files.
