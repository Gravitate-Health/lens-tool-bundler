# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.6] - 2026-02-14

### Added
- **Bundle Prioritization**: Intelligent lens file matching for bundle operations
  - Added `--bundle (-b)` flag to explicitly specify target Library JSON file
  - Implemented two-tier prioritization: exact filename match (lens.js → lens.json) > name parameter match
  - `findBundleFile()` method with FHIR Library validation
  - All bundling modes support explicit target files (default, package.json, interactive)
  - 10 new prioritization tests covering single/batch operations and edge cases
  - Documentation comments in batch-bundle explaining pairing logic

### Changed
- Bundle command now intelligently finds matching Library files before creating new ones
- Batch-bundle operations respect same prioritization rules for consistent behavior
- All 153 tests passing (up from 143)

### Fixed
- Removed duplicate method definitions and unused imports
- Fixed ESLint perfectionist/sort-classes warnings

## [0.5.5] - 2026-02-04

### Added
- **Enhanced lslens Command**: New flags for advanced lens discovery and validation
  - `--almost-valid`: Filter lenses with minor validation issues (1-2 content-related errors)
  - `--show-reasons (-r)`: Display detailed requirements for full FHIR Lens profile compliance
  - `getMissingRequirements()` method based on FHIR Lens profile specification
  - Shows specific field requirements with descriptions (name, version, status, description, purpose, usage, copyright, type, identifier, jurisdiction, parameter, content, LEE version extension)
- **Content Field Validation**: Robust handling of malformed content fields
  - Enhanced validation to handle missing, null, string, object, and empty array content values
  - `Array.isArray()` checks replace truthy checks for proper type validation
  - Auto-enhancement of lenses with invalid content using default enhance function
  - 22 new tests for content field edge cases across bundle, check, and test commands
  - All 143 tests passing (up from 121)

### Changed
- **Clean ls-like Output**: Removed all discovery debug messages from console output
  - `lslens` now outputs only file paths by default (perfect for piping to xargs)
  - Discovery messages removed from `discoverLenses()` in `dir-controller.ts`
  - Validation details available via `--validate` or `--show-reasons` flags
- Updated README with enhanced lslens documentation and examples
- Updated test count from 83 to 143 tests in documentation
- Added "List" feature to Features section

### Fixed
- Content field validation now properly handles all edge cases (missing, null, string, object, empty array)
- Bundle update operations now create content arrays when missing or invalid

## [0.5.4] - 2026-02-03

### Added
- **File Exclusion System**: Comprehensive exclusion support for batch operations
  - `DEFAULT_EXCLUSIONS`: Automatically excludes `node_modules/`, `package.json`, and `package-lock.json`
  - `--exclude` flag now accepts multiple patterns via repeated usage (e.g., `--exclude "test.*" --exclude "draft"`)
  - Directory exclusions prevent traversal for performance optimization
  - Exclusion support added to all batch commands: `batch-bundle`, `batch-check`, `batch-test`, `batch-upload`
  - New `isExcluded()` helper function for consistent exclusion checking
- **Test Coverage**: 11 new tests for exclusion functionality
  - Tests for `isExcluded()`, `DEFAULT_EXCLUSIONS`, and exclusion behavior in `findJsonFiles()` and `findEnhanceFiles()`
  - All 121 tests passing

### Changed
- Updated `dir-controller.ts` with exclusion parameter support:
  - `findJsonFiles(dir, exclusions)`: Excludes directories and files matching patterns
  - `findEnhanceFiles(dir, exclusions)`: Excludes JS files before processing
  - `discoverLenses(path, exclusions)`: Applies exclusions during lens discovery
- Enhanced all batch commands to build exclusion lists from defaults + user patterns
- Improved code quality by fixing ESLint `lonely-if` warnings using guard clauses
- Updated README with "File Exclusions" section and examples
- Updated copilot-instructions.md with exclusion feature documentation

### Fixed
- ESLint `unicorn/prefer-string-raw` errors in example strings with backslashes
- ESLint `unicorn/no-lonely-if` warnings in directory traversal code

## [0.5.3] - 2026-02-03

### Added
- **Cross-Platform Encoding Support**: Automatic encoding detection and conversion for source JS files
  - Added `chardet` dependency for automatic encoding detection (UTF-8, UTF-16LE, Windows-1252, Latin1, etc.)
  - Added `iconv-lite` dependency for encoding conversion
  - All FHIR Library bundles now store UTF-8 base64 content regardless of source file encoding
  - `--source-encoding` flag added to `bundle`, `check`, `batch-bundle`, `batch-check`, and `batch-upload` commands
  - Automatic BOM (Byte Order Mark) stripping from UTF-8 files
  - Cross-platform integrity checks now pass when bundling on one OS (e.g., Mac UTF-16LE) and checking on another (e.g., Linux UTF-8)
- **New Test Coverage**: 26 additional tests for encoding scenarios (109 total, up from 83)
  - Unit tests for encoding detection, conversion, and BOM handling (`test/controllers/file-controller.test.ts`)
  - Integration tests for cross-platform scenarios (`test/commands/encoding-integration.test.ts`)
  - Unicode and emoji character handling tests
- **New Helper Functions**: `readRawBase64FromLens()` test helper for raw base64 verification

### Changed
- Enhanced `file-controller.ts` with encoding-aware file reading functions:
  - `getFileData(filePath, sourceEncoding?)`: Read with auto-detection or specified encoding
  - `getFileDataWithEncoding(filePath, sourceEncoding?)`: Returns content and detected encoding
  - `toBase64Utf8(content)`: Always produces UTF-8 base64 output
  - `stripBom(content)`: Removes UTF-8 BOM markers
  - `resolveEncoding(buffer, sourceEncoding?)`: Auto-detect or use specified encoding
- Updated all bundling and checking operations to use encoding-aware functions
- Updated README with encoding documentation and examples
- Updated copilot-instructions.md with encoding feature details

### Fixed
- Import ordering to comply with ESLint `perfectionist/sort-imports` rules
- Integrity check failures when source files use non-UTF-8 encodings

## [0.5.2] - 2026-02-01

### Fixed
- All ESLint errors resolved (23 → 0 errors)
- All command tests now passing (upgraded @oclif/test to v4.1.16)
- Path import statements now use proper named imports
- Indentation consistency across all files

### Changed
- Migrated from deprecated .eslintignore to eslint.config.mjs ignores
- Updated test framework to oclif v4 with runCommand() pattern
- Comprehensive documentation updates for testing and patterns

### Removed
- Deprecated .eslintignore file
- Empty test/fixtures directory (now dynamically created)

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
