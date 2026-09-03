## 1. Extract Domain Config to Separate File

- [x] 1.1 Create `domain-names.js` with exported `FRIENDLY_DOMAINS` and `URL_PATTERN_NAMES`
- [x] 1.2 Add comments in `domain-names.js` explaining how users can add custom mappings
- [x] 1.3 Update `core.js` to import from `domain-names.js`
- [x] 1.4 Remove hardcoded `FRIENDLY_DOMAINS` and `URL_PATTERN_NAMES` from `core.js`
- [x] 1.5 Verify extension still works after extraction

## 2. Storage Layer for UI Customizations

- [x] 2.1 Add `loadCustomDomainNames()` function to load from `chrome.storage.local`
- [x] 2.2 Add `saveCustomDomainName(domain, customName)` function to save/update
- [x] 2.3 Add `removeCustomDomainName(domain)` function to reset to default
- [x] 2.4 Cache custom names in memory for fast lookup during rendering

## 3. Core Integration

- [x] 3.1 Add `getDisplayName(domain)` that checks: Chrome storage → domain-names.js → fallback
- [x] 3.2 ~~Update `TextHelpers.friendlyDomain()` to use `getDisplayName()`~~ N/A - Browse Mode uses `getDisplayName()` directly; `friendlyDomain()` is synchronous and only used internally

## 4. Browse Mode UI

- [x] 4.1 Add edit icon (✏️) to `.browse-domain-header` that appears on hover
- [x] 4.2 Add CSS for edit icon hover state and positioning
- [x] 4.3 Add inline edit input that replaces domain name when editing
- [x] 4.4 Style inline edit input to match existing design

## 5. Edit Functionality

- [x] 5.1 Add click handler for edit icon to enter edit mode
- [x] 5.2 Implement `startDomainEdit(domain, currentName)` to show input
- [x] 5.3 Implement `saveDomainEdit(domain, newName)` to save and re-render
- [x] 5.4 Handle Enter key to save
- [x] 5.5 Handle Escape key to cancel
- [x] 5.6 Handle blur (click outside) to save
- [x] 5.7 Handle empty input to reset to default name (remove from Chrome storage)

## 6. State Management

- [x] 6.1 Load custom domain names on overlay init
- [x] 6.2 Update `browseData` to include resolved display names
- [x] 6.3 Re-render domain group after name change

## 7. Testing

- [ ] 7.1 Test file extraction: extension loads correctly
- [ ] 7.2 Test rename workflow: hover → click edit → type → Enter
- [ ] 7.3 Test cancel with Escape
- [ ] 7.4 Test persistence across page reload
- [ ] 7.5 Test reset to default with empty input
- [ ] 7.6 Test priority: Chrome storage > domain-names.js > fallback
- [ ] 7.7 Test user can manually edit domain-names.js and see changes after reload
