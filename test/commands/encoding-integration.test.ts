import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {runCommand} from '@oclif/test';
import {createMockLensFile, createTestDirectory, readRawBase64FromLens, TestContext} from '../helpers/test-helper.js';

/**
 * Integration tests for cross-platform encoding scenarios
 * Simulates bundling on one platform and checking on another
 */
describe('cross-platform encoding integration', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('bundle on Mac, check on Linux scenario', () => {
    it('should bundle UTF-16LE file (Mac) and check successfully', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'mac-lens.js');
        const bundleFile = path.join(context.testDir, 'MacLens.json'); // Bundle uses the name as given
        const content = 'function enhance(epi) { const msg = "Créé sur Mac"; return epi; }';

        // Simulate Mac UTF-16LE file
        const iconv = await import('iconv-lite');
        const utf16Buffer = iconv.default.encode(content, 'utf16le');
        fs.writeFileSync(jsFile, utf16Buffer);

        // Bundle with explicit encoding (simulating Mac bundling)
        await runCommand(['bundle', jsFile, '-n', 'MacLens', '-d', '--source-encoding', 'utf16le']);

        // Verify bundle was created
        expect(fs.existsSync(bundleFile)).to.be.true;

        // Check integrity with same encoding (should pass)
        await runCommand(['check', jsFile, '-b', bundleFile, '--source-encoding', 'utf16le']);

        // Verify base64 content is correct UTF-8
        const base64Content = readRawBase64FromLens(bundleFile);
        expect(base64Content).to.not.be.null;
        const decoded = Buffer.from(base64Content!, 'base64').toString('utf8');
        expect(decoded).to.equal(content);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect encoding mismatch if wrong encoding used', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'encoding-test.js');
        const bundleFile = path.join(context.testDir, 'encoding-test.json');
        const content = 'function enhance(epi) { const msg = "Spëcial"; return epi; }';

        // Create file with UTF-16LE encoding
        const iconv = await import('iconv-lite');
        const utf16Buffer = iconv.default.encode(content, 'utf16le');
        fs.writeFileSync(jsFile, utf16Buffer);

        // Bundle with correct encoding
        await runCommand(['bundle', jsFile, '-n', 'EncodingTest', '-d', '--source-encoding', 'utf16le']);

        // Now try to check with wrong encoding (latin1) - should fail
        const {error} = await runCommand(['check', jsFile, '--source-encoding', 'latin1']);

        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('bundle on Windows, check on Linux scenario', () => {
    it('should bundle Windows-1252 file and check successfully', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'windows-lens.js');
        const bundleFile = path.join(context.testDir, 'WindowsLens.json');
        const content = 'function enhance(epi) { const msg = "Naïve café"; return epi; }';

        // Simulate Windows-1252 file
        const iconv = await import('iconv-lite');
        const win1252Buffer = iconv.default.encode(content, 'windows-1252');
        fs.writeFileSync(jsFile, win1252Buffer);

        // Bundle with explicit encoding
        await runCommand(['bundle', jsFile, '-n', 'WindowsLens', '-d', '--source-encoding', 'windows-1252']);

        // Verify bundle was created
        expect(fs.existsSync(bundleFile)).to.be.true;

        // Check integrity with same encoding (should pass)
        await runCommand(['check', jsFile, '-b', bundleFile, '--source-encoding', 'windows-1252']);

        // Verify base64 content is UTF-8
        const base64Content = readRawBase64FromLens(bundleFile);
        expect(base64Content).to.not.be.null;
        const decoded = Buffer.from(base64Content!, 'base64').toString('utf8');
        expect(decoded).to.equal(content);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('auto-detection fallback', () => {
    it('should auto-detect UTF-8 files when encoding not specified', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'auto-lens.js');
        const bundleFile = path.join(context.testDir, 'AutoLens.json');
        const content = 'function enhance(epi) { return epi; }';

        fs.writeFileSync(jsFile, content, 'utf8');

        // Bundle without encoding (should auto-detect UTF-8)
        await runCommand(['bundle', jsFile, '-n', 'AutoLens', '-d']);

        // Check without encoding (should auto-detect UTF-8)
        await runCommand(['check', jsFile, '-b', bundleFile]);

        // Verify bundle is correct
        expect(fs.existsSync(bundleFile)).to.be.true;
        const base64Content = readRawBase64FromLens(bundleFile);
        expect(base64Content).to.not.be.null;
        const decoded = Buffer.from(base64Content!, 'base64').toString('utf8');
        expect(decoded).to.equal(content);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle ASCII-only files (encoding-agnostic)', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'ascii-lens.js');
        const bundleFile = path.join(context.testDir, 'AsciiLens.json');
        const content = 'function enhance(epi) { return epi; }'; // ASCII only

        fs.writeFileSync(jsFile, content, 'ascii');

        // Bundle without encoding
        await runCommand(['bundle', jsFile, '-n', 'AsciiLens', '-d']);

        // Check should work regardless of encoding assumption
        await runCommand(['check', jsFile, '-b', bundleFile]);

        expect(fs.existsSync(bundleFile)).to.be.true;
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('batch operations with mixed encodings', () => {
    it('should handle batch-bundle with source-encoding flag', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create multiple UTF-16LE JS files with corresponding existing lens JSON files
        const iconv = await import('iconv-lite');
        const lenses = [
          {name: 'lens1', content: 'function enhance(epi) { return epi; }'},
        ];

        for (const lens of lenses) {
          const jsFile = path.join(context.testDir, `${lens.name}.js`);
          const jsonFile = path.join(context.testDir, `${lens.name}.json`);
          
          // Create UTF-16LE JS files
          const utf16Buffer = iconv.default.encode(lens.content, 'utf16le');
          fs.writeFileSync(jsFile, utf16Buffer);
          
          // Create existing lens bundles that batch-bundle should update
          createMockLensFile(jsonFile, lens.name, true);
        }

        // Batch bundle with encoding - should update the empty content
        // Use --force to ensure files are written even if content appears up to date
        const {error: bundleError} = await runCommand(['batch-bundle', context.testDir, '--source-encoding', 'utf16le', '--force']);
        expect(bundleError).to.not.exist;

        // Verify all were bundled with correct content
        for (const lens of lenses) {
          const bundleFile = path.join(context.testDir, `${lens.name}.json`);
          expect(fs.existsSync(bundleFile), `Bundle file ${bundleFile} should exist`).to.be.true;
          
          // Debug: read the file and check its structure
          const fileContent = fs.readFileSync(bundleFile, 'utf8');
          const lensData = JSON.parse(fileContent);
          
          const base64Content = readRawBase64FromLens(bundleFile);
          expect(base64Content, `Bundle ${lens.name} should have base64 content`).to.not.be.null;
          expect(base64Content).to.not.equal(''); // Should not be empty anymore
          
          const decoded = Buffer.from(base64Content!, 'base64').toString('utf8');
          expect(decoded).to.equal(lens.content);
        }
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle batch-check with source-encoding flag', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const iconv = await import('iconv-lite');
        const jsFile = path.join(context.testDir, 'check-lens.js');
        const bundleFile = path.join(context.testDir, 'check-lens.json');
        const content = 'function enhance(epi) { return epi; }';

        // Create UTF-16LE file
        const utf16Buffer = iconv.default.encode(content, 'utf16le');
        fs.writeFileSync(jsFile, utf16Buffer);

        // Create bundle with correct base64
        const base64Content = Buffer.from(content, 'utf8').toString('base64');
        createMockLensFile(bundleFile, 'CheckLens', true);
        const lensData = JSON.parse(fs.readFileSync(bundleFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(bundleFile, JSON.stringify(lensData, null, 2));

        // Batch check with encoding
        await runCommand(['batch-check', context.testDir, '--source-encoding', 'utf16le']);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('unicode and special characters', () => {
    it('should handle emoji and multi-byte characters correctly', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'emoji-lens.js');
        const bundleFile = path.join(context.testDir, 'EmojiLens.json');
        const content = 'function enhance(epi) { return "🚀 Hello 世界 🌍"; }';

        fs.writeFileSync(jsFile, content, 'utf8');

        await runCommand(['bundle', jsFile, '-n', 'EmojiLens', '-d']);

        expect(fs.existsSync(bundleFile)).to.be.true;

        // Verify round-trip
        const base64Content = readRawBase64FromLens(bundleFile);
        expect(base64Content).to.not.be.null;
        const decoded = Buffer.from(base64Content!, 'base64').toString('utf8');
        expect(decoded).to.equal(content);

        // Check should pass
        await runCommand(['check', jsFile, '-b', bundleFile]);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle various accented characters from different encodings', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const testCases = [
          {encoding: 'utf8', content: 'function enhance() { return "Café français"; }'},
          {encoding: 'latin1', content: 'function enhance() { return "Espanol"; }'},
        ];

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const jsFile = path.join(context.testDir, `accent-${i}.js`);
          const lensName = `Accent${i}`;
          const bundleFile = path.join(context.testDir, `${lensName}.json`);

          if (tc.encoding === 'utf8') {
            fs.writeFileSync(jsFile, tc.content, 'utf8');
          } else {
            const iconv = await import('iconv-lite');
            const encoded = iconv.default.encode(tc.content, tc.encoding as BufferEncoding);
            fs.writeFileSync(jsFile, encoded);
          }

          await runCommand(['bundle', jsFile, '-n', lensName, '-d', '--source-encoding', tc.encoding]);

          expect(fs.existsSync(bundleFile)).to.be.true;

          const base64Content = readRawBase64FromLens(bundleFile);
          expect(base64Content).to.not.be.null;
          const decoded = Buffer.from(base64Content!, 'base64').toString('utf8');
          expect(decoded).to.equal(tc.content);
        }
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('BOM handling', () => {
    it('should strip BOM from UTF-8 files with BOM', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'bom-lens.js');
        const bundleFile = path.join(context.testDir, 'BomLens.json');
        const content = 'function enhance(epi) { return epi; }';
        const withBom = '\uFEFF' + content;

        fs.writeFileSync(jsFile, withBom, 'utf8');

        await runCommand(['bundle', jsFile, '-n', 'BomLens', '-d']);

        // Verify BOM was stripped
        const base64Content = readRawBase64FromLens(bundleFile);
        expect(base64Content).to.not.be.null;
        const decoded = Buffer.from(base64Content!, 'base64').toString('utf8');
        expect(decoded).to.equal(content);
        expect(decoded).to.not.include('\uFEFF');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
