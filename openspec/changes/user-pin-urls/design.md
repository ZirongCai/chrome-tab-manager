## Context

The Tab Out extension currently has a hardcoded `PINNED_URLS` object in `search.js` that defines URLs which appear at the top of search results when matching keywords. Users cannot customize these pins without modifying the source code.

The extension already uses Chrome's storage API for other settings (e.g., group settings). The search system has a clear scoring hierarchy where pinned results get scores of 8000-10000, placing them above all other result types.

## Goals / Non-Goals

**Goals:**
- Allow users to pin any URL from search results with a single click
- Persist user pins across browser sessions using Chrome storage
- Merge user pins with built-in pins in search results
- Provide visual distinction between user pins and built-in pins
- Allow users to unpin previously pinned URLs

**Non-Goals:**
- Custom keyword assignment for user pins (will auto-generate from URL/title)
- Importing/exporting pin configurations
- Syncing pins across devices (using local storage only)
- Editing pin titles or URLs after creation
- Reordering pins manually

## Decisions

### 1. Storage Format
**Decision**: Store user pins as an array of objects in `chrome.storage.local` under key `userPinnedUrls`.

```javascript
{
  userPinnedUrls: [
    { url: 'https://example.com', title: 'Example', keywords: ['example', 'demo'], pinnedAt: 1718520000000 }
  ]
}
```

**Rationale**: Matches the existing `PINNED_URLS` structure for easy merging. Using `local` instead of `sync` avoids sync storage quota limits and complexity. The `pinnedAt` timestamp enables future sorting by recency if needed.

**Alternative considered**: Storing as a Set of URLs only — rejected because we need title and keywords for search matching.

### 2. Keyword Auto-Generation
**Decision**: Extract keywords automatically from the URL's hostname and pathname segments.

```javascript
// "https://github.com/user/repo" → ["github", "user", "repo"]
// "https://dashboard.example.com/admin" → ["dashboard", "example", "admin"]
```

**Rationale**: Provides reasonable search matching without requiring user input. Users can find pinned URLs by typing any part of the URL. Simple implementation that covers most use cases.

**Alternative considered**: Asking user to enter keywords — rejected for adding friction to a quick-pin action.

### 3. Pin Button Placement
**Decision**: Add a small pin icon button on the right side of each result item, visible on hover.

**Rationale**: Keeps the UI clean by hiding the action until needed. Right side placement follows convention (actions on the right). Hover reveal is consistent with other progressive disclosure patterns.

**Alternative considered**: Context menu option — rejected as less discoverable and requires more clicks.

### 4. User Pin Priority
**Decision**: User pins score 9500 (between built-in exact match at 10000 and prefix match at 9900).

**Rationale**: Built-in pins are curated for the team and should have slight priority for exact keyword matches. But user pins should still rank above prefix matches of built-in pins.

### 5. Pin State in Search Results
**Decision**: Add a `pinnedBy: 'user' | 'builtin' | null` field to search results.

**Rationale**: Enables UI to show different styling for user pins (e.g., filled pin icon) vs built-in pins (e.g., outline icon), and determines whether unpin action is available.

## Risks / Trade-offs

**[Risk] Storage quota exceeded** → User pins are small (~200 bytes each); Chrome local storage allows 5MB. Would need 25,000+ pins to hit limit. Monitor storage usage if analytics shows heavy pin usage.

**[Risk] Stale titles** → If a page's title changes, the pinned title becomes outdated. → Accept for MVP; users can unpin and re-pin if needed.

**[Trade-off] No custom keywords** → Users might want to pin a URL under a specific keyword. → Simplicity wins for MVP; can add later if requested.

**[Trade-off] No visual distinction in results list** → Both user and built-in pins show same badge. → Accepted; the pin button state (filled vs outline) provides enough distinction without cluttering the UI.
