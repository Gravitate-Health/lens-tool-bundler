# Test Suite Status

**Last Updated**: 2 February 2026  
**Version**: 0.5.1

## Summary

- **Total Tests**: 83
- **✅ Passing**: 47 (57%)
- **❌ Failing**: 36 (43% - require oclif test framework)

## Breakdown by Category

### ✅ Fully Tested (47 tests passing)

#### Unit Tests (26 tests)

1. **Models** (`test/models/lens-fhir-resource.test.ts`) - 11 tests
   - Factory methods (defaultValues, interactiveValues, fromPackageJson)
   - FHIR compliance validation
   - Name normalization and formatting
   - Package.json metadata extraction

2. **Controllers** (`test/controllers/dir-controller.test.ts`) - 15 tests
   - FHIR lens validation (6 tests)
   - Base64 conversion (3 tests)
   - JSON file discovery (3 tests)
   - Enhance file discovery (3 tests)

#### Integration Tests (21 tests)

3. **Batch Operations** (`test/commands/batch.test.ts`) - 21 tests
   - Multiple lens discovery (4 tests)
   - File pairing strategies (4 tests)
   - Multi-lens validation (2 tests)
   - Batch processing scenarios (2 tests)
   - Base64 encoding validation (1 test)
   - File system operations (3 tests)
   - Edge cases (5 tests)

### ⚠️ Needs oclif Test Framework (36 tests)

These tests are implemented but cannot run without proper oclif command context:

4. **New Command** (`test/commands/new.test.ts`) - ~8 tests
   - Simple mode (default values, force, normalization)
   - Template mode (cloning, subdirectory creation)
   - Edge cases (special chars, long names)

5. **Bundle Command** (`test/commands/bundle.test.ts`) - ~12 tests
   - Positive cases (create, update, preserve properties, skip-date)
   - Negative cases (missing files, invalid JS, bad JSON)
   - Edge cases (large files, unicode, empty files)

6. **Check Command** (`test/commands/check.test.ts`) - ~10 tests
   - Positive cases (synchronized files, formatting)
   - Negative cases (desync, missing files, invalid base64)
   - Edge cases (whitespace, large files, unicode, paths)

7. **Test Command** (`test/commands/test-command.test.ts`) - ~12 tests
   - Positive cases (valid enhance, verbose mode)
   - Negative cases (missing, invalid FHIR, syntax errors, bad behavior)
   - Edge cases (complex logic, paths)
   - Exit codes (0 and 1 verification)

## How to Run Tests

### Run All Tests
```bash
npm test
```

**Expected Output**:
```
47 passing (130ms)
36 failing
```

### Run Only Passing Tests

```bash
# Models
npm test -- --grep "LensFhirResource"

# Controllers
npm test -- --grep "dir-controller"

# Batch operations
npm test -- --grep "batch operations"
```

### Run Specific Test File
```bash
npx mocha test/models/lens-fhir-resource.test.ts
npx mocha test/controllers/dir-controller.test.ts
npx mocha test/commands/batch.test.ts
```

## Fixing Failing Tests

The 36 failing tests all fail with the same root cause:

```
TypeError: this.config.runHook is not a function
```

This happens because oclif commands require a proper `config` object that includes hooks, plugins, and other framework features.

### Solution Options

#### Option 1: Install @oclif/test (Recommended)

```bash
npm install --save-dev @oclif/test
```

Then update command tests:

```typescript
import {expect, test} from '@oclif/test'

describe('new command', () => {
  test
    .stdout()
    .command(['new', 'TestLens', '--default'])
    .it('creates a lens', ctx => {
      expect(ctx.stdout).to.contain('successfully')
    })
})
```

#### Option 2: Mock Config Object

```typescript
import {Config} from '@oclif/core'

describe('new command', () => {
  it('creates a lens', async () => {
    const config = await Config.load()
    const cmd = new New(['TestLens', '--default'], config)
    await cmd.run()
    // ... assertions
  })
})
```

#### Option 3: CLI Integration Tests

```typescript
import {exec} from 'node:child_process'
import {promisify} from 'node:util'

const execAsync = promisify(exec)

describe('new command', () => {
  it('creates a lens', async () => {
    const {stdout} = await execAsync('lens-tool-bundler new TestLens --default')
    expect(stdout).to.include('successfully')
  })
})
```

## Test Coverage Analysis

### What's Covered ✅

- ✅ **FHIR Library resource creation** - All factory methods tested
- ✅ **Directory operations** - File discovery, validation, pairing
- ✅ **Base64 encoding/decoding** - Including unicode and special chars
- ✅ **Batch processing** - Multiple lens handling, edge cases
- ✅ **File system operations** - Recursive traversal, filtering
- ✅ **Data validation** - FHIR compliance, structure validation
- ✅ **Edge cases** - Large files, special chars, empty dirs, duplicates

### What's Not Covered ❌

- ❌ **Command execution** - new, bundle, check, test commands
- ❌ **User interaction** - inquirer prompts
- ❌ **Network operations** - git clone, FHIR server upload
- ❌ **Error handling** - Command-level error messages and exit codes
- ❌ **File I/O in commands** - Actual file creation/modification
- ❌ **CI/CD workflows** - GitHub Actions integration

## Development Workflow

### Before Committing

1. Run tests: `npm test`
2. Verify 47 tests still passing
3. Fix any new failures in unit/integration tests
4. Update this file if test count changes

### Adding New Tests

1. Use test helpers from `test/helpers/test-helper.ts`
2. Follow existing patterns (see `test/README.md`)
3. Clean up in `afterEach` hooks
4. Run your new tests in isolation first
5. Update counts in this file

### CI/CD Considerations

Current test command will **exit with error code** due to 36 failing tests.

For CI/CD, either:

1. Fix the failing tests using one of the solutions above
2. Or run only passing tests:
   ```bash
   npm test -- --grep "LensFhirResource|dir-controller|batch operations"
   ```

## Next Steps

To achieve 100% test coverage:

1. **Immediate**: Implement oclif test framework (Option 1 or 2 above)
2. **Short-term**: Add upload controller tests with mocked fetch
3. **Medium-term**: Add CLI integration tests for full workflows
4. **Long-term**: Add coverage reporting with nyc/istanbul

## References

- [Test README](./test/README.md) - Detailed test documentation
- [oclif Testing Docs](https://oclif.io/docs/testing)
- [Mocha](https://mochajs.org/)
- [Chai](https://www.chaijs.com/)
