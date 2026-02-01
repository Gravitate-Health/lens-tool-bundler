# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-02-01

### Added
- **Template Mode**: `--template` flag to clone full lens-template repository with complete development setup
- **Fork Support**: `--fork` flag to fork template repository to user's GitHub account
- **Smart Directory Detection**: Automatically creates lens in current directory if empty
- **Package.json Sync**: `LensFhirResource.fromPackageJson()` factory method to sync metadata
- **Enhanced Keywords**: Comprehensive npm keywords for better discoverability
- **Apache License**: Added full LICENSE.txt file with proper copyright notices
- **Professional Documentation**: Improved package.json description and metadata

### Changed
- `new` command now has two modes: simple (default) and template
- Forked repositories are named after the lens (not "lens-template")
- License field updated to SPDX identifier (Apache-2.0)

### Fixed
- Current directory usage when empty in template mode
- Fork repository naming to use lens name

## [0.4.3] - 2024-XX-XX

### Added
- Comprehensive exit codes for CI/CD integration (0, 1, 2)
- Exit code documentation in README
- Proper error handling in all commands

### Changed
- All batch commands now exit with code 1 on failures
- Improved error messages with FHIR OperationOutcome parsing

## [0.4.2] - 2024-XX-XX

### Fixed
- FHIR upload compliance issues
- Changed PATCH to PUT for resource updates
- Content-Type header to `application/fhir+json`
- Search parameter from `name:exact` to `name`
- Removed id field on POST requests (server auto-generates)

## [0.4.1] - 2024-XX-XX

### Fixed
- Exit code 0 error in test commands
- Replaced `this.exit(0)` with `return` to prevent internal errors

## [0.4.0] - 2024-XX-XX

### Added
- Batch operations for bundle, upload, test, and check
- Comprehensive testing with `@gravitate-health/lens-tool-test`
- File discovery and validation in directories
- Smart skipping with `--skip-valid` flag

## [0.3.0] - 2024-XX-XX

### Added
- Upload command to deploy lenses to FHIR servers
- Check command to verify integrity between JS and bundles
- List commands (lslens, lsenhancejs)

## [0.2.0] - 2024-XX-XX

### Added
- Bundle command with interactive and default modes
- Base64 encoding of JavaScript lens functions
- FHIR Library resource generation

## [0.1.0] - 2024-XX-XX

### Added
- Initial release
- New command to create lens files
- Basic project structure

[0.5.0]: https://github.com/Gravitate-Health/lens-tool-bundler/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/Gravitate-Health/lens-tool-bundler/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/Gravitate-Health/lens-tool-bundler/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Gravitate-Health/lens-tool-bundler/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Gravitate-Health/lens-tool-bundler/releases/tag/v0.4.0
