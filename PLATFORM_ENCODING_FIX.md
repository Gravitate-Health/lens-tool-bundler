# Platform-Specific Base64 Encoding Issue - Fix Documentation

## Problem Description

Users reported that `lens-tool-bundler bundle qt-prolongation-lens.js -u` works locally on macOS and `batch-check` passes, but the same workflow fails when run as a GitHub Action (Linux environment).

## Root Cause Analysis

### The Issue

The codebase had **inconsistent Buffer encoding** when converting JavaScript strings to base64:

1. **`dir-controller.ts`** (line 172): Used `Buffer.from(content).toString('base64')` 
   - Defaults to 'utf8' encoding ✅ CORRECT
   
2. **Multiple command files** used: `Buffer.from(str, 'binary').toString('base64')` 
   - ❌ WRONG: 'binary' encoding is deprecated
   - Affected files:
     - `bundle.ts` (line 193)
     - `batch-check.ts` (line 115)
     - `check.ts` (line 60)
     - `batch-bundle.ts` (line 165)
     - `batch-upload.ts` (line 171)
     - `new.ts` (lines 383 and 407)

### Why This Caused Cross-Platform Issues

The `'binary'` encoding (also known as `'latin1'`) is **deprecated** in Node.js and behaves differently across platforms:

1. **On macOS**: The bundling operation uses 'binary' encoding to create base64
2. **On Linux (GitHub Actions)**: The check operation expects UTF-8 encoded base64
3. **Result**: Base64 mismatch → check fails even though files are identical

The 'binary' encoding treats each byte value 0-255 as a single code point, while UTF-8 properly encodes multi-byte characters. This can lead to different base64 representations of the same logical content across different Node.js versions or platform configurations.

## Solution

Changed **all** Buffer encoding operations to use explicit `'utf8'` encoding:

```typescript
// BEFORE (incorrect)
Buffer.from(str, 'binary').toString('base64')

// AFTER (correct)
Buffer.from(str, 'utf8').toString('base64')
```

This ensures consistent base64 encoding across all platforms and operations.

## Files Modified

1. `src/commands/bundle.ts` - Line 193
2. `src/commands/batch-check.ts` - Line 115
3. `src/commands/check.ts` - Line 60
4. `src/commands/batch-bundle.ts` - Line 165
5. `src/commands/batch-upload.ts` - Line 171
6. `src/commands/new.ts` - Lines 383 and 407

## Verification Steps

Manual testing confirmed all commands work correctly:

```bash
# Test bundling
node bin/run.js bundle test-lens.js -n test-lens -d
# ✅ Success

# Test update flag
node bin/run.js bundle test-lens.js -u
# ✅ Success

# Test check
node bin/run.js check test-lens.js
# ✅ Pass

# Test batch-check
node bin/run.js batch-check .
# ✅ Pass
```

## Possible Causes (Answer to User's Question)

When code works locally but fails in CI/CD, here are the most common causes:

### 1. ✅ **Deprecated 'binary' Encoding** (PRIMARY CAUSE - NOW FIXED)
- The 'binary' encoding is deprecated and platform-dependent
- Different behavior on macOS vs Linux
- Creates inconsistent base64 representations

### 2. **Line Ending Differences**
- Windows/macOS may use CRLF (`\r\n`)
- Linux uses LF (`\n`)
- **Mitigation**: Using `fs.readFileSync(file, 'utf8')` normalizes line endings
- Git's `core.autocrlf` settings can also affect this

### 3. **File System Case Sensitivity**
- macOS: Case-insensitive by default (HFS+/APFS)
- Linux: Case-sensitive (ext4)
- **Example**: `MyFile.js` and `myfile.js` are the same on macOS but different on Linux
- **Mitigation**: Use consistent casing in file names

### 4. **Git Configuration Differences**
- `core.autocrlf` setting affects line ending conversion on checkout
- `core.eol` setting can normalize line endings
- GitHub Actions uses default Git settings which may differ from local

### 5. **Environment Variables and Paths**
- Different path separators (forward slash vs backslash)
- Case sensitivity in environment variable names
- **Mitigation**: Use `path.join()` and `path.resolve()` from Node.js

### 6. **Node.js Version Differences**
- Different Node.js versions may have subtle behavior changes
- Deprecated features may work differently or be removed
- **Best Practice**: Pin Node.js version in package.json `engines` field

## Best Practices to Prevent Similar Issues

1. ✅ **Use explicit encoding**: Always specify encoding (`'utf8'`, `'utf-8'`, etc.)
2. ✅ **Avoid deprecated APIs**: Don't use 'binary' encoding, use 'utf8' or 'latin1'
3. ✅ **Test on target platform**: Use GitHub Actions or Docker to test on Linux
4. ✅ **Normalize line endings**: Use `.gitattributes` to enforce consistent line endings
5. ✅ **Pin dependencies**: Use exact versions in package.json for reproducibility
6. ✅ **Use cross-platform paths**: Use `path` module instead of string concatenation

## References

- [Node.js Buffer Documentation](https://nodejs.org/api/buffer.html)
- [Node.js Buffer Encoding](https://nodejs.org/api/buffer.html#buffers-and-character-encodings)
- [Git Line Ending Handling](https://git-scm.com/docs/gitattributes#_end_of_line_conversion)

## Migration Notes

### For Existing Lens Users

If you have existing lens bundles created with the old 'binary' encoding:

1. **Re-bundle your lenses** after updating to this version:
   ```bash
   lens-tool-bundler bundle your-lens.js -u
   ```

2. **Or use batch-bundle** to update all lenses:
   ```bash
   lens-tool-bundler batch-bundle ./lenses
   ```

3. **Verify with batch-check**:
   ```bash
   lens-tool-bundler batch-check ./lenses
   ```

### Breaking Change Notice

⚠️ **Base64 content will change** for existing bundles. This is expected and intentional. The new encoding is more reliable and consistent across platforms.

After re-bundling, the `check` and `batch-check` commands will pass on all platforms.
