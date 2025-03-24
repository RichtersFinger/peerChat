# Changelog

## [x.y.z] - 2025-??-??

### Changed

### Added

### Removed

### Fixed

- fixed message boxes not using available space (following changes in 0.6.1)

## [0.6.1] - 2025-03-24

### Added

- added markdown-preview button to chat input

### Fixed

- fixed issue with overflowing chat message-boxes
- fixed 'Send'-button being functional for empty input

## [0.6.0] - 2025-03-22

### Added

- added markdown support via `react-markdown`

## [0.5.0] - 2025-03-12

### Added

- added desktop notifications on host-machine via `desktop-notifier`-package

### Fixed

- fixed fetching `CHANGELOG.md` for specific version

## [0.4.0] - 2025-03-09

### Changed

- changed layout to justify message-text on left for own messages

### Added

- added display for peer avatar images

### Fixed

- added reset of avatar-preview in configuration-dialog on close
- updated node-dependency versions

## [0.3.1] - 2025-03-08

### Fixed

- fixed deadlock-issue in `GET-/update/info`

## [0.3.0] - 2025-03-07

### Added

- added application-updates via client

## [0.2.0] - 2025-03-03

### Changed

- changed avatar image-fit to 'cover'

### Added

- add software-version info to UI

## [0.1.1] - 2025-03-03

### Added

- added 'service'-target to Makefile for easy configuration with `systemd`

### Fixed

- fixed bug where malformed messages sent in existing conversations could lead to deletion of conversation

## [0.1.0] - 2025-03-02

### Changed

- initial release
