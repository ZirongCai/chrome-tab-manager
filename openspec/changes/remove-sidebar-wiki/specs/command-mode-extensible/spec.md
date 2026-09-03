## ADDED Requirements

### Requirement: Command mode provides extensible framework
The overlay SHALL support a command mode activated by typing `/` that provides an extensible framework for future commands.

#### Scenario: Entering command mode
- **WHEN** user types `/` as the first character in the search input
- **THEN** the system enters command mode and displays available commands

#### Scenario: No commands available
- **WHEN** user enters command mode and no commands are registered
- **THEN** the system displays a message indicating no commands are available

#### Scenario: Typing removed command
- **WHEN** user types `/wiki` (a removed command)
- **THEN** the system displays a message indicating this command has been removed

### Requirement: Command registration architecture
The command system SHALL support adding new commands without modifying core overlay logic.

#### Scenario: Command structure
- **WHEN** a developer wants to add a new command
- **THEN** they can register it by adding to the commands array with name, description, and handler

## REMOVED Requirements

### Requirement: Wiki search command
**Reason**: Wiki search feature underutilized; simplifying codebase
**Migration**: Users should use their browser to access wiki directly

### Requirement: Sidebar panel
**Reason**: Browse Mode in overlay provides equivalent functionality with better UX
**Migration**: Use `Cmd+Shift+K` then press `Tab` to access Browse Mode for tab overview
