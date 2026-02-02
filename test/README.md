# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the lens-tool-bundler CLI tool, focusing on core functionality, integration scenarios, and edge cases.

## Test Structure

### ✅ All Tests Passing (83 tests) 🎉

**Testing Framework**: oclif v4 with @oclif/test v4.1.16

#### Unit Tests

##### `test/models/lens-fhir-resource.test.ts` (11 tests)
Tests the FHIR Library resource model creation and validation:
- Factory methods: `defaultValues()`, `interactiveValues()`, `fromPackageJson()`
- FHIR compliance validation
- Name normalization (kebab-case)
- Date formatting (ISO 8601)
- Content structure validation
- Package.json metadata extraction

##### `test/controllers/dir-controller.test.ts` (15 tests)
Tests directory operations and file discovery:
- **FHIR lens validation** (6 tests):
  - Valid lens detection
  - Missing required fields detection
  - Invalid content array handling
  - Non-Library resource type rejection
  - URL and status validation
- **Base64 conversion** (3 tests):
  - JavaScript to base64 encoding
  - Unicode character handling
  - Binary data preservation
- **JSON file discovery** (3 tests):
  - Recursive directory traversal
  - File filtering by extension
  - Nested directory handling
- **Enhance file discovery** (3 tests):
  - Enhance function pattern matching
  - Multiple file handling
  - Directory fallback logic

#### Integration Tests

##### `test/commands/batch.test.ts` (21 tests)
Tests batch operations and multi-lens scenarios:
- **Multiple lens discovery** (4 tests):
  - Parallel lens detection
  - Subdirectory traversal
  - Orphaned file handling (JS without JSON, JSON without JS)
- **Exact match vs fallback pairing** (4 tests):
  - Prioritization of exact name matches
  - Fallback mechanism when no exact match
  - Multiple enhance file listing
- **Validation of multiple lenses** (2 tests):
  - Mixed valid/invalid lens handling
  - Automatic base64 content enhancement
- **Batch processing scenarios** (2 tests):
  - Real project simulation (multiple lenses)
  - Mixed content filtering (lenses vs non-lens files)
- **Base64 encoding validation** (1 test):
  - Content encoding/decoding for all lenses
  - Unicode and multi-line content preservation
- **File system operations** (3 tests):
  - Recursive JSON file finding
  - Empty directory handling
  - Non-lens file filtering
- **Edge cases** (5 tests):
  - Large number of lenses (50+)
  - Identical content handling
  - Special characters in filenames

#### Command Tests (36 tests)

**All command tests now passing using @oclif/test v4.1.16!**

##### `test/commands/new.test.ts` (7 tests)
Tests the `new` command for creating lenses:
- **Simple mode** (4 tests): Default values, force flag, file existence, kebab-case ID normalization
- **Template mode** (2 tests): Full repository cloning, subdirectory creation
- **Edge cases** (1 test): Special characters in names

##### `test/commands/bundle.test.ts` (10 tests)
Tests the `bundle` command for JS → FHIR Library conversion:
- **Positive cases** (4 tests): New bundle creation, existing bundle update, property preservation, skip-date flag
- **Negative cases** (3 tests): Missing files, files without enhance function, malformed JSON
- **Edge cases** (3 tests): Large files, unicode content, empty files

##### `test/commands/check.test.ts` (10 tests)
Tests the `check` command for integrity verification:
- **Positive cases** (2 tests): Synchronized files, formatting differences
- **Negative cases** (4 tests): Desynchronized content, missing files, missing base64, invalid base64
- **Edge cases** (4 tests): Whitespace differences, large files, unicode, path handling

##### `test/commands/test-command.test.ts` (9 tests)
Tests the `test` command for lens validation:
- **Positive cases** (2 tests): Valid enhance function, verbose mode
- **Negative cases** (5 tests): Missing files, invalid FHIR structure, missing base64, syntax errors, incorrect behavior
- **Edge cases** (2 tests): Complex logic, relative/absolute paths

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- --grep "lens-fhir-resource"
npm test -- --grep "batch operations"
```

### Run With Coverage (if configured)
```bash
npm run test:coverage
```

## Test Helpers

### `test/helpers/test-helper.ts`
Provides utilities for test setup and teardown:

#### Functions

- **`createTestDirectory()`**: Creates temporary test directory with automatic cleanup
- **`createMockEnhanceFile(filePath, functionName?)`**: Creates mock JavaScript enhance function
- **`createMockLensFile(filePath, name, includeBase64?)`**: Creates mock FHIR Library JSON
- **`createPackageJson(filePath, name)`**: Creates package.json for template tests
- **`readBase64ContentFromLens(filePath)`**: Decodes and returns base64 content from lens
- **`waitForFile(filePath, timeout?)`**: Waits for file creation with timeout

#### Usage Example

```typescript
import {createTestDirectory, createMockEnhanceFile, TestContext} from '../helpers/test-helper.js';

describe('my test', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  it('should do something', () => {
    createMockEnhanceFile(path.join(context.testDir, 'test.js'));
    // ... test code
  });
});
```

## Testing Framework

### @oclif/test v4.1.16 Implementation ✅

All command tests now use the oclif v4 testing framework with the `runCommand()` pattern:

```typescript
import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('bundle command', () => {
  it('should bundle a lens', async () => {
    const {error} = await runCommand(['bundle', 'mylens.js', '--name', 'MyLens', '--default'])
    
    expect(error).to.not.exist
    // Verify bundle was created
  })
  
  it('should handle errors properly', async () => {
    const {error} = await runCommand(['bundle', 'nonexistent.js', '--name', 'Test'])
    
    expect(error).to.exist
    expect((error as any)?.oclif?.exit).to.equal(1)
  })
})
```

### Key Testing Patterns

**Exit Code Handling**: Commands use proper exit codes for CI/CD integration
- Exit 0: Success
- Exit 1: Validation failures (check mismatches, test failures)
- Exit 2: Fatal errors (missing files, parse errors)

**Error Destructuring**: Use proper error destructuring from runCommand:
```typescript
const {error, stdout, stderr} = await runCommand(['command', 'args'])
```

**EEXIT Exception Handling**: The check command properly handles EEXIT exceptions from `this.exit()` calls to avoid wrapping exit codes incorrectly

const config = await Config.load()
const cmd = new New(['TestLens', '--default'], config)
await cmd.run()
```

### Option 3: CLI Integration Tests

Run commands via child_process:

```typescript
import {exec} from 'node:child_process'
import {promisify} from 'node:util'

const execAsync = promisify(exec)

it('should create lens', async () => {
  const {stdout} = await execAsync('lens-tool-bundler new TestLens --default')
  expect(stdout).to.include('successfully')
})
```

## Test Coverage Goals

- [x] Models: 100% (11/11 tests passing)
- [x] Controllers: 100% (15/15 tests passing)  
- [x] Batch Operations: 100% (21/21 tests passing)
- [ ] Commands: 0% (36/36 tests require oclif setup)

**Total: 47 passing, 36 requiring infrastructure**

## Test History

### ✅ February 2026: oclif v4 Upgrade Complete

Successfully upgraded from @oclif/test v3.2.15 to v4.1.16, fixing all 36 command tests:

**Changes Made**:
1. **Upgraded testing framework**: @oclif/test v3.2.15 → v4.1.16
2. **Updated test patterns**: Converted all command tests to use `runCommand()` API
3. **Fixed command implementations**:
   - Bundle command: Added `--default` flag support for non-interactive mode
   - Check command: Fixed EEXIT exception handling to preserve exit codes
   - Check command: Changed missing file scenarios to throw (exit 2) instead of returning false (exit 1)
4. **Fixed test expectations**:
   - Updated filename expectations (bundle uses `--name` flag value, not input filename)
   - Corrected exit code expectations (1 for validation failures, 2 for errors)
   - Fixed new command test to avoid space-separated arguments

**Result**: 83/83 tests passing (was 47/83)

## Future Enhancements

1. **Add upload tests** - Mock FHIR server interactions
2. **Add CLI integration tests** - End-to-end workflow testing
3. **Add coverage reporting** - Use nyc/istanbul for coverage metrics
4. **Add CI/CD integration** - GitHub Actions workflow for automated testing
5. **Add performance tests** - Benchmark batch operations with large datasets
6. **Add snapshot testing** - Verify FHIR resource structure stability

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use test helpers from `test/helpers/test-helper.ts`
3. Always clean up test directories in `afterEach` hooks
4. Add appropriate timeout values for slow operations (network, large files)
5. Document edge cases and expected behaviors
6. Ensure tests are independent and can run in any order

## Test Patterns

### Pattern 1: Temporary Directory Setup

```typescript
describe('feature', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  it('test case', () => {
    // Use context.testDir
  });
});
```

### Pattern 2: Error Handling

```typescript
it('should fail when...', async () => {
  let error: Error | undefined;
  
  try {
    await operationThatShouldFail();
  } catch (err) {
    error = err as Error;
  }
  
  expect(error).to.exist;
  expect(error?.message).to.include('expected error');
});
```

### Pattern 3: Process CWD Changes

```typescript
it('should work in different directory', () => {
  const originalCwd = process.cwd();
  
  try {
    process.chdir(context.testDir);
    // ... test code
  } finally {
    process.chdir(originalCwd);
  }
});
```

## Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [oclif Testing Guide](https://oclif.io/docs/testing)
- [TypeScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
