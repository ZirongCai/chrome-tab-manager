## 1. Setup Fuse.js

- [x] 1.1 Download fuse.min.js to `extension/lib/fuse.min.js`
- [x] 1.2 Update `manifest.json` to include fuse.min.js in content scripts

## 2. Integrate Fuse.js into Search

- [x] 2.1 Import Fuse in `search.js` and create Fuse instance with configured options (title weight 0.7, URL weight 0.3, threshold 0.4)
- [x] 2.2 Modify `UnifiedSearch.search()` to use Fuse.js for initial matching instead of manual `_scoreItem` for basic matching
- [x] 2.3 Convert Fuse.js scores (0-1, lower is better) to compatible scores (higher is better) and combine with type/recency/frequency weights
- [x] 2.4 Update `_getUserPinnedResults()` to use Fuse.js for pin matching while preserving 9000+ base scores

## 3. Unified Collapse Logic

- [x] 3.1 Change `MAX_INITIAL_ITEMS` constant in `overlay.js` from 3 to 2
- [x] 3.2 Modify `renderSearchResults()` to apply collapse logic to Pinned group (currently only applied to regular groups)
- [x] 3.3 Ensure "Show N more" button text correctly reflects hidden item count for all groups including Pinned

## 4. Testing & Verification

- [x] 4.1 Test fuzzy search: verify "githbu" finds "github", "dash" finds "dashboard"
- [x] 4.2 Test multi-word search: verify "gard poc" finds results with both terms
- [x] 4.3 Test pin collapse: verify pinned group shows max 2 items with "Show more" when >2 pins match
- [x] 4.4 Test keyboard navigation: verify arrow keys can navigate to "Show more" buttons and Enter expands
- [x] 4.5 Test score ordering: verify tabs rank above bookmarks above history for same query match
