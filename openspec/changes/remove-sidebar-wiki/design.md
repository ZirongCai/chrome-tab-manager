## Context

Tab Manager extension currently has three main entry points:
1. **Overlay** (`Cmd+Shift+K`): Quick search with recently added Browse Mode for tab overview
2. **Sidebar** (`Cmd+Shift+P`): Full panel view for tab management
3. **Wiki Search**: `/wiki` command for searching internal wiki

User feedback indicates sidebar is rarely used—Browse Mode in the overlay provides a better UX. Wiki search is also underutilized. The command system (`/` prefix) in overlay is valuable for extensibility and should be preserved.

## Goals / Non-Goals

**Goals:**
- Remove sidebar feature to reduce codebase complexity
- Remove wiki search functionality while preserving command infrastructure
- Keep `/` command mode as extensible framework for future commands
- Ensure Browse Mode fully replaces sidebar functionality

**Non-Goals:**
- Adding new commands (future work)
- Modifying Browse Mode functionality
- Changing core search behavior

## Decisions

### 1. Complete removal vs. feature flag
**Decision**: Complete removal of sidebar and wiki code

**Rationale**: No plans to re-enable these features. Dead code adds maintenance burden. Git history preserves the code if needed later.

### 2. Command system handling
**Decision**: Keep command mode parsing in overlay.js, but remove wiki-specific handlers

**Rationale**: The `/` command detection and routing infrastructure is valuable. Future commands (e.g., `/settings`, `/help`, `/bookmark`) can reuse this. Only remove wiki-specific code.

### 3. Manifest changes
**Decision**: Remove `sidePanel` permission and configuration entirely

**Rationale**: Chrome requires explicit permission for side panel. Removing unused permission follows principle of least privilege.

### 4. Keyboard shortcut reuse
**Decision**: Remove `Cmd+Shift+P` binding, do not reassign

**Rationale**: Avoid user confusion. Users can use `Cmd+Shift+K` + Tab for Browse Mode.

## Risks / Trade-offs

**[Risk] Users relying on sidebar** → Browse Mode provides equivalent functionality; document in release notes

**[Risk] Breaking wiki command for existing users** → Show helpful message when `/wiki` is typed explaining feature removal

**[Trade-off] Code removal vs. keeping stubs** → Chose complete removal for cleaner codebase; Git history available if needed
