## Context

The Tab Out extension has two main interfaces:
1. **Search overlay** (Cmd+Shift+K) - Quick search across tabs, bookmarks, history
2. **Sidebar panel** (Cmd+Shift+P) - Full tab management with grouped views

The user-pin-urls feature was recently added to the search overlay, allowing users to pin URLs that appear at the top of search results. The sidebar currently shows tabs organized by domain folders and tab groups, but lacks pinning capability.

The sidebar uses `sidepanel.js` for logic, `sidepanel.html` for structure, and `sidepanel.css` for styling. Tab chips are rendered via `renderTabChip()` function. The existing pin storage (`userPinnedUrls`) in `search.js` is already shared across the extension.

## Goals / Non-Goals

**Goals:**
- Add pin buttons to tab chips in the sidebar (hover-to-reveal, like overlay)
- Display a dedicated "Pinned" section at the top of the sidebar
- Share pin state with search overlay (same storage key)
- Consistent visual language (same icon, colors as overlay)

**Non-Goals:**
- Pinning tab groups (only individual URLs)
- Drag-and-drop reordering of pinned items
- Sync across devices (using local storage only)
- Pin from right-click context menu

## Decisions

### 1. Pinned Section Placement
**Decision**: Add a collapsible "Pinned" section above the Groups section in the sidebar.

**Rationale**: Pinned items should be the most accessible, so placing them at the very top makes sense. Collapsible to match existing section behavior (Groups, Ungrouped).

**Alternative considered**: Showing pinned indicator on existing tab chips only — rejected because users want quick access to pinned URLs even if the tab isn't currently open.

### 2. Reuse Existing Storage
**Decision**: Import and use the pin functions from `search.js` (`loadUserPins`, `addUserPin`, `removeUserPin`).

**Rationale**: Already implemented, tested, and ensures consistency. Pins made in search overlay automatically appear in sidebar and vice versa.

### 3. Pin Button on Tab Chips
**Decision**: Add a pin button (same SVG icon as overlay) to the left of the close button on each tab chip, visible on hover.

**Rationale**: Matches overlay pattern. Right side of chip is the action area (close button), so pin fits naturally there.

### 4. Pinned Section Items
**Decision**: Pinned items in the Pinned section show favicon, title, and unpin button. Clicking opens the URL (in new tab or focuses existing).

**Rationale**: Same interaction pattern as domain folder tabs. Simple and predictable.

## Risks / Trade-offs

**[Risk] Storage sync timing** → Pin state changes in overlay might not reflect immediately in open sidebar. → Mitigation: Listen for `chrome.storage.onChanged` events to refresh Pinned section.

**[Trade-off] Duplicate display** → A pinned URL that's also an open tab shows in both Pinned section and its domain folder. → Accepted; provides quick access while maintaining organizational context. Could add visual indicator that it's also pinned.

**[Trade-off] No keywords in sidebar** → Unlike search overlay, sidebar doesn't use keywords for matching. → Acceptable since sidebar is browsing-oriented, not search-oriented.
