# Copilot Instructions: Lens Tool Bundler

## Project Overview

This is an oclif-based CLI tool for bundling and managing FHIR Lenses for the Gravitate Health project. It converts JavaScript lens enhancement functions into FHIR-compliant Library resources with base64-encoded content.

**Key Purpose**: Transform raw JavaScript lens files into standardized FHIR Library resources, upload them to FHIR servers, and manage batch operations.

## Architecture & Data Flow

### Core Workflow
1. **JS → Base64**: JavaScript enhance functions are read and base64-encoded
2. **FHIR Wrapping**: Encoded content is wrapped in FHIR Library resource with metadata (see [lens-fhir-resource.ts](../src/models/lens-fhir-resource.ts))
3. **Output/Upload**: Written to JSON files or uploaded to FHIR servers

### Component Structure
- **Commands** ([src/commands/](../src/commands/)): oclif command handlers (bundle, batch-bundle, upload, etc.)
- **Controllers** ([src/controllers/](../src/controllers/)): Business logic for file I/O, directory operations, uploads
- **Models** ([src/models/](../src/models/)): FHIR resource structure (LensFhirResource, Contact, Content, etc.)

### Key Architectural Decisions
- **oclif framework**: Uses v3+ with ES modules (`type: "module"`)
- **Dual entry points**: [bin/run.js](../bin/run.js) (production) and [bin/dev.js](../bin/dev.js) (dev with ts-node)
- **File pairing convention**: `<name>.js` (enhance function) pairs with `<name>.json` (FHIR bundle)
- **Base64 validation**: Detects if JS content changed to avoid unnecessary re-bundling

## Development Workflows

### Build & Run
```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Run in development mode (ts-node)
./bin/dev.cmd <cmd>    # Windows dev execution
lens-tool-bundler      # After npm link or global install
```

### Testing
```bash
npm test               # Runs mocha tests + lint (83 tests, all passing)
npm run lint           # ESLint with @typescript-eslint
```

**Testing Framework**: @oclif/test v4.1.16 with Mocha + Chai
- All 83 tests passing (47 unit/integration + 36 command tests)
- Uses `runCommand()` pattern from oclif v4
- Proper exit code handling (0 = success, 1 = validation failure, 2 = fatal error)

### Key Scripts
- `prepack`: Builds and generates oclif manifest before publishing
- `version`: Updates README with `oclif readme` command

## Critical Patterns & Conventions

### File Discovery & Pairing
[dir-controller.ts](../src/controllers/dir-controller.ts) implements two-tier matching:
1. **Exact match**: `enhance-lens.js` → `enhance-lens.json`
2. **Fallback**: Any JS with `enhance` function in same directory

Example enhance function patterns detected:
```javascript
function enhance()
const enhance = 
async function enhance()
enhance: function
```

### Batch Processing Logic
Commands like [batch-bundle.ts](../src/commands/batch-bundle.ts) use these flags:
- `--skip-valid (-s)`: Skip lenses with valid base64 (unless content changed)
- `--skip-date (-d)`: Don't update date field on bundling
- `--force (-f)`: Rebundle even if content unchanged
- `--exclude (-e)`: Regex to exclude files by filename

### FHIR Resource Construction
[LensFhirResource](../src/models/lens-fhir-resource.ts) has three factory methods:
- `defaultValues(name, lens)`: Minimal FHIR Library with placeholder metadata
- `interactiveValues(name, desc, purpose, usage, lens)`: User-provided metadata
- `fromPackageJson(packageJson, lens)`: Extract metadata from package.json (name, version, description, author, license, purpose, usage, copyright)

Always creates:
- `resourceType: "Library"`
- `id`: lowercased name with hyphens
- `date`: ISO 8601 timestamp
- `content[0].data`: base64-encoded JS

### New Lens Creation
[new.ts](../src/commands/new.ts) has two modes:

**Simple Mode (default)**: Fetches single JS file from raw.githubusercontent.com
- Creates `<name>.js` and `<name>.json` in current directory
- Uses default or interactive metadata prompts

**Template Mode (`--template`)**: Clones full lens-template repository
- Clones from `https://github.com/Gravitate-Health/lens-template.git`
- Creates directory with lens name (lowercased, hyphenated), or uses current directory if empty
- Updates `package.json` with lens metadata (interactive or default)
- Renames `my-lens.js` → `<name>.js` and `my-lens.json` → `<name>.json`
- Deletes template `README.md` and renames `LENS_README_TEMPLATE.md` → `README.md`
- Syncs metadata from package.json to FHIR Library using `fromPackageJson()`
- Removes `.git` directory to start fresh
- Includes testing framework, GitHub Actions workflows, and development setup

**Fork Mode (`--template --fork`)**: Like template mode but forks repo first
- Requires GitHub CLI (`gh`) to be installed
- Forks `Gravitate-Health/lens-template` to user's GitHub account with the new lens name
- Clones from user's fork instead of upstream
- Allows user to maintain their own template customizations

### Upload Strategy
[upload-controller.ts](../src/controllers/upload-controller.ts):
1. GET `{domain}/Library?name={encodeURIComponent(name)}` to check existence
2. If found: PUT to update existing resource (FHIR standard update operation)
3. If not found: POST to create new resource (with `id` field removed)

**FHIR Compliance**:
- Content-Type: `application/fhir+json` (not `application/json`)
- POST: Server auto-generates `id`, so client must not provide it
- PUT: Client must provide matching `id` for existing resource
- Search parameter: Use `name=` (not `name:exact=`) for better compatibility

### Spinner Convention
Commands use ora spinners with helper functions from [spinner-controller.ts](../src/controllers/spinner-controller.ts):
- `changeSpinnerText()`: Update spinner message
- `stopAndPersistSpinner()`: Stop with checkmark + message
- Final `⭐` symbol indicates successful completion

## Integration Points

### External Dependencies
- **oclif**: CLI framework (commands, flags, args parsing)
- **inquirer**: Interactive prompts (used in `bundle` and `new` commands)
- **ora**: Terminal spinners for progress feedback

### FHIR Server Integration
Expects FHIR R4-compliant servers (tested with HAPI FHIR) supporting:
- `Library` resource type
- Search by `name` parameter (e.g., `?name={value}`)
- PUT for updates (standard FHIR update operation)
- POST for creation (server auto-generates resource IDs)
- Content-Type: `application/fhir+json`
- Returns FHIR `OperationOutcome` resources on errors with structured diagnostics

### Lens Template
`new` command fetches: `https://raw.githubusercontent.com/Gravitate-Health/lens-template/refs/heads/main/my-lens.js`

## Project-Specific Rules

### Module System
- **ES Modules only**: All imports must use `.js` extension even for `.ts` files
- Example: `import { LensFhirResource } from '../models/lens-fhir-resource.js'`

### File Naming
- Commands: kebab-case (e.g., `batch-bundle.ts`)
- Models: kebab-case (e.g., `lens-fhir-resource.ts`)
- Classes: PascalCase (e.g., `LensFhirResource`)

### Date Handling
- Always use ISO 8601: `new Date().toISOString()`
- Date updates can be skipped with `--skip-date` flag in batch operations

### Error Handling & Exit Codes
**All commands MUST use proper exit codes for CI/CD integration:**
- **Exit 0**: Success - all operations completed without errors
- **Exit 1**: Failure - one or more operations failed
- **Exit 2**: Fatal error - unexpected errors (used by batch-check)

Commands catch file I/O errors and display with `spinner.fail()`, then call `this.error(message, { exit: 1 })` to exit with proper code.

**Implementation Pattern**:
```typescript
try {
  // operations
  if (result.errors > 0) {
    this.error('Some operations failed', { exit: 1 });
  }
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  spinner.fail(`Error: ${message}`);
  this.error(message, { exit: 1 });
}
```

**Never use `this.exit(0)` inside try-catch blocks** - it throws internally and will be caught as an error. Use `return` instead.

## Testing

### Lens Testing with @gravitate-health/lens-tool-test
Commands use `runComprehensiveLensTests` which returns `Promise<ComprehensiveResult[]>`:
- Each result contains: `success`, `hasErrors`, `errors[]`, `metrics` (preservation stats)
- Tests validate content preservation and focusing functionality
- Exit with error code on failure for CI/CD integration

### Test Commands
- `test`: Test single lens, exits with code 1 on failure
- `batch-test`: Test multiple lenses with `--fail-fast` option

## Useful Commands for Development

```bash
# Create new lens from template (simple mode - fetches single JS file)
lens-tool-bundler new MyLens -d

# Create new lens from full template repository
lens-tool-bundler new MyLens --template -d

# Create new lens by forking the template repo first (requires gh CLI)
lens-tool-bundler new MyLens --template --fork

# Bundle single lens interactively
lens-tool-bundler bundle enhance.js -n "My Lens"

# Batch bundle with smart skipping
lens-tool-bundler batch-bundle ./lenses --skip-valid

# Upload to FHIR server (note: domain should NOT include /Library path)
lens-tool-bundler upload lens.json -d https://fhir.example.com/api/fhir

# Batch upload with error handling
lens-tool-bundler batch-upload ./lenses -d https://fhir.example.com/api/fhir

# Test single lens with verbose output
lens-tool-bundler test lens.json -v

# Batch test with fail-fast mode
lens-tool-bundler batch-test ./lenses --fail-fast

# Check integrity between JS and bundle
lens-tool-bundler check mylens.js

# Batch check all lenses
lens-tool-bundler batch-check ./lenses

# List all valid lenses with validation
lens-tool-bundler lslens -v

# List enhance JS files with pairing details
lens-tool-bundler lsenhancejs -d
```

## Testing

### Command Testing with oclif v4

All command tests use @oclif/test v4.1.16 with the `runCommand()` pattern:

```typescript
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

it('should execute command', async () => {
  const {error, stdout, stderr, result} = await runCommand(['command', 'arg1', '--flag'])
  
  // Check success
  expect(error).to.not.exist
  
  // Or check error with exit code
  expect(error).to.exist
  expect((error as any)?.oclif?.exit).to.equal(1)
})
```

**Exit Code Conventions**:
- `exit(0)`: Success - all operations completed
- `exit(1)`: Validation failures - check mismatches, test failures, content validation
- `exit(2)`: Fatal errors - missing files, parse errors, unexpected exceptions

**Important**: Commands use `this.exit()` which throws EEXIT exceptions internally. Catch blocks must check for and rethrow EEXIT to avoid wrapping exit codes incorrectly.

### Test Helpers

Use helpers from `test/helpers/test-helper.ts` for common operations:
- `createTestDirectory()`: Temp directory with auto-cleanup
- `createMockEnhanceFile()`: Mock JavaScript lens function
- `createMockLensFile()`: Mock FHIR Library bundle
- `readBase64ContentFromLens()`: Decode bundle content for verification

## CI/CD Integration

All commands return proper exit codes for automation:

```bash
# Fail pipeline if any tests fail
lens-tool-bundler batch-test ./lenses || exit 1

# Bundle and verify in sequence
lens-tool-bundler batch-bundle ./lenses && \
lens-tool-bundler batch-check ./lenses && \
lens-tool-bundler batch-test ./lenses

# Conditional upload on success
if lens-tool-bundler batch-test ./lenses; then
  lens-tool-bundler batch-upload ./lenses -d $FHIR_SERVER
fi
```

## Release Process

**Pre-Release Checklist:**
Before starting a release, ensure:
- All changes are committed and pushed
- Working directory is clean (`git status`)
- On the correct branch (typically `main` or `master`)
- Pull latest changes (`git pull`)

**Release Steps:**

1. **Lint the codebase**
   ```bash
   npm run lint
   ```
   Fix any linting errors before proceeding.

2. **Security audit**
   ```bash
   npm audit
   ```
   - If vulnerabilities found: `npm audit fix` (review changes carefully)
   - For high/critical issues: manually update dependencies and retest

3. **Update lens-tool-test to latest version**
   ```bash
   npm update @gravitate-health/lens-tool-test
   ```
   Or check for latest and install explicitly:
   ```bash
   npm info @gravitate-health/lens-tool-test version
   npm install @gravitate-health/lens-tool-test@latest --save-dev
   ```

4. **Build the project**
   ```bash
   npm run build
   ```
   Verify `dist/` directory is generated correctly.

5. **Run tests**
   ```bash
   npm test
   ```
   All tests must pass before proceeding.

6. **Update CHANGELOG.md**
   - Document new features, bug fixes, and breaking changes
   - Follow [Keep a Changelog](https://keepachangelog.com/) format
   - Add release date

7. **Version bump**
   Choose bump type based on changes:
   - `patch`: Bug fixes, minor changes (1.0.0 → 1.0.1)
   - `minor`: New features, backwards compatible (1.0.0 → 1.1.0)
   - `major`: Breaking changes (1.0.0 → 2.0.0)
   
   ```bash
   npm version patch  # or minor, or major
   ```
   This automatically:
   - Updates `package.json` version
   - Creates a git commit with message "v<version>"
   - Creates a git tag "v<version>"
   - Runs `preversion`, `version`, and `postversion` scripts

   **Manual alternative:**
   ```bash
   # If you need more control:
   npm version patch --no-git-tag-version  # Update version only
   git add package.json package-lock.json
   git commit -m "chore: release v<version>"
   git tag -a v<version> -m "Release v<version>"
   ```

8. **Push changes and tags**
   ```bash
   git push && git push --tags
   ```
   Or push to specific remote:
   ```bash
   git push origin main --follow-tags
   ```

9. **Verify npm authentication**
   ```bash
   npm whoami
   ```
   If not logged in:
   ```bash
   npm login
   ```
   Use your npm credentials. For scoped packages, ensure you have publish access.

10. **Publish to npm**
    ```bash
    npm publish
    ```
    For scoped packages (e.g., `@gravitate-health/...`):
    ```bash
    npm publish --access public
    ```

11. **Post-publish verification**
    ```bash
    # Verify published version
    npm info lens-tool-bundler version
    
    # Test installation in temp directory
    cd $(mktemp -d)
    npm install -g lens-tool-bundler@latest
    lens-tool-bundler --version
    ```

**Quick Release Commands (when all checks pass):**
```bash
npm run lint && \
npm audit && \
npm update @gravitate-health/lens-tool-test && \
npm run build && \
npm test && \
npm version patch && \
git push --follow-tags && \
npm publish
```

**Rollback a Release:**
If a published version has critical issues:
```bash
# Deprecate the bad version (don't unpublish)
npm deprecate lens-tool-bundler@<version> "Critical bug, use version X.Y.Z instead"

# Publish a patch release with fixes
npm version patch
npm publish
```

**Common Issues:**

- **`npm publish` fails with 403**: Check npm login and package access rights
- **Git tag already exists**: Delete tag with `git tag -d v<version>` and `git push origin :refs/tags/v<version>`
- **Tests fail after dependency update**: Review breaking changes in `@gravitate-health/lens-tool-test`
- **Build errors**: Clean and rebuild with `rm -rf dist node_modules && npm install && npm run build`
