## Context

Tab Manager's Browse Mode groups tabs by domain. Domain names come from:
1. `FRIENDLY_DOMAINS` map in `core.js` (e.g., "github.com" → "GitHub")
2. Fallback: cleaned hostname

Users want to:
1. Customize these names via in-app editing
2. Add their own domain mappings by editing a config file

## Goals / Non-Goals

**Goals:**
- Extract `FRIENDLY_DOMAINS` to a separate config file (`domain-names.js`)
- Allow in-place editing of domain group names in Browse Mode
- Persist user customizations in Chrome storage (overrides config file)
- Simple, intuitive UX (click to edit, Enter to save)

**Non-Goals:**
- Pattern-based renaming (e.g., "*.google.com")
- Cross-device sync (future enhancement)

## Decisions

### 1. Config file structure
**Decision**: Create `domain-names.js` as a separate module

**Rationale**: 
- Users can directly edit the file to add permanent domain mappings
- Keeps `core.js` cleaner
- Easy to share/version control domain configs

**File: `domain-names.js`**
```javascript
// Default domain name mappings
// Users can add their own mappings here
export const FRIENDLY_DOMAINS = {
  'github.com': 'GitHub',
  'youtube.com': 'YouTube',
  // ... other defaults
};

// Add your custom domain names below:
// 'internal.mycompany.com': 'Company Portal',
// 'jira.mycompany.com': 'Bug Tracker',
```

### 2. Two-layer storage
**Decision**: Config file (defaults) + Chrome storage (user edits from UI)

**Priority order**:
1. Chrome storage `customDomainNames` (highest - user edited via UI)
2. `FRIENDLY_DOMAINS` from `domain-names.js` (file-based config)
3. Fallback: cleaned hostname

**Rationale**:
- File edits = permanent additions (for power users/developers)
- UI edits = quick customizations (stored in Chrome storage)
- Both coexist without conflict

### 3. Edit UI in Browse Mode
**Decision**: Inline edit with edit icon on hover

**UI Flow**:
1. Hover domain header → edit ✏️ icon appears
2. Click icon → name becomes editable input
3. Enter → save to Chrome storage; Escape → cancel
4. Empty input → reset (remove from Chrome storage, fall back to config/default)

### 4. Domain key format
**Decision**: Use hostname as key (e.g., "github.com")

## File Changes

| File | Change |
|------|--------|
| `domain-names.js` | **NEW** - Export `FRIENDLY_DOMAINS` with defaults |
| `core.js` | Import from `domain-names.js`, add `getDisplayName()` |
| `overlay.js` | Add edit UI, Chrome storage handlers |
| `overlay.html` | Add CSS for edit icon and inline input |

## Risks / Trade-offs

**[Trade-off] File vs pure Chrome storage** → Hybrid approach gives both power-user control and easy UI editing

**[Note] File edits require extension reload** → Chrome storage edits are instant
