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
npm test               # Runs mocha tests + lint
npm run lint           # ESLint with @typescript-eslint
```

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
[LensFhirResource](../src/models/lens-fhir-resource.ts) has two factory methods:
- `defaultValues(name, lens)`: Minimal FHIR Library with placeholder metadata
- `interactiveValues(name, desc, purpose, usage, lens)`: User-provided metadata

Always creates:
- `resourceType: "Library"`
- `id`: lowercased name with hyphens
- `date`: ISO 8601 timestamp
- `content[0].data`: base64-encoded JS

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
# Create new lens from template
lens-tool-bundler new MyLens -d

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
