import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {runCommand} from '@oclif/test';
import {createMockEnhanceFile, createMockLensFile, createTestDirectory, TestContext} from '../helpers/test-helper.js';

describe('check command', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('positive cases - synchronized files', () => {
    it('should pass when JS and JSON are synchronized', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create synchronized files
        const jsFile = path.join(context.testDir, 'sync-lens.js');
        const jsonFile = path.join(context.testDir, 'sync-lens.json');
        
        const jsContent = 'function enhance(epi) { return epi; }';
        fs.writeFileSync(jsFile, jsContent);
        
        const base64Content = Buffer.from(jsContent).toString('base64');
        createMockLensFile(jsonFile, 'SyncLens', true);
        
        // Update JSON with same base64 content
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        // Run check command
        await runCommand(['check', jsFile]);
        

      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should pass when source encoding is specified', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'latin1-lens.js');
        const jsonFile = path.join(context.testDir, 'latin1-lens.json');

        const jsContent = 'function enhance(epi) { const msg = "Héllo"; return epi; }';
        const latin1Buffer = Buffer.from(jsContent, 'latin1');
        fs.writeFileSync(jsFile, latin1Buffer);

        const base64Content = Buffer.from(jsContent, 'utf8').toString('base64');
        createMockLensFile(jsonFile, 'Latin1Lens', true);

        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        await runCommand(['check', jsFile, '--source-encoding', 'latin1']);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should detect matching content regardless of formatting', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'format-lens.js');
        const jsonFile = path.join(context.testDir, 'format-lens.json');
        
        // JS file with specific formatting
        const jsContent = 'function enhance(epi) {\n  return epi;\n}';
        fs.writeFileSync(jsFile, jsContent);
        
        const base64Content = Buffer.from(jsContent).toString('base64');
        createMockLensFile(jsonFile, 'FormatLens', true);
        
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        await runCommand(['check', jsFile]);
        

      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('negative cases - desynchronized files', () => {
    it('should fail when JS content differs from JSON', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'diff-lens.js');
        const jsonFile = path.join(context.testDir, 'diff-lens.json');
        
        // Create files with different content
        fs.writeFileSync(jsFile, 'function enhance(epi) { return "modified"; }');
        
        const oldContent = 'function enhance(epi) { return epi; }';
        const base64Content = Buffer.from(oldContent).toString('base64');
        createMockLensFile(jsonFile, 'DiffLens', true);
        
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(['check', jsFile]);

        // Should fail with exit code 1 (content mismatch)
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when JSON file is missing', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'missing-json.js');
        createMockEnhanceFile(jsFile);

        const {error} = await runCommand(['check', jsFile]);

        // Missing base64 content is treated as a file structure error (exit 2)
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(2);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when JSON has no base64 content', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'no-base64.js');
        const jsonFile = path.join(context.testDir, 'no-base64.json');
        
        createMockEnhanceFile(jsFile);
        createMockLensFile(jsonFile, 'NoBase64', false); // No base64 content

        await runCommand(['check', jsFile]);
        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when JSON content is not valid base64', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'invalid-base64.js');
        const jsonFile = path.join(context.testDir, 'invalid-base64.json');
        
        createMockEnhanceFile(jsFile);
        createMockLensFile(jsonFile, 'InvalidBase64', true);
        
        // Set invalid base64
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = 'not-valid-base64!!!';
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        await runCommand(['check', jsFile]);
        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle JS files with whitespace differences', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'whitespace.js');
        const jsonFile = path.join(context.testDir, 'whitespace.json');
        
        // JS with extra whitespace
        const jsContent = 'function enhance(epi) {  \n\n  return epi;  \n}\n';
        fs.writeFileSync(jsFile, jsContent);
        
        // JSON with exact same content including whitespace
        const base64Content = Buffer.from(jsContent).toString('base64');
        createMockLensFile(jsonFile, 'Whitespace', true);
        
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        await runCommand(['check', jsFile]);
        

        // Should pass because content is exactly the same
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle very large files', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'large-check.js');
        const jsonFile = path.join(context.testDir, 'large-check.json');
        
        const largeContent = 'function enhance(epi) {\n' + '  // Line\n'.repeat(5000) + '  return epi;\n}';
        fs.writeFileSync(jsFile, largeContent);
        
        const base64Content = Buffer.from(largeContent).toString('base64');
        createMockLensFile(jsonFile, 'LargeCheck', true);
        
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        await runCommand(['check', jsFile]);
        

      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle files with unicode characters', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'unicode.js');
        const jsonFile = path.join(context.testDir, 'unicode.json');
        
        const unicodeContent = 'function enhance(epi) { const msg = "Héllo Wörld 🚀"; return epi; }';
        fs.writeFileSync(jsFile, unicodeContent);
        
        const base64Content = Buffer.from(unicodeContent).toString('base64');
        createMockLensFile(jsonFile, 'Unicode', true);
        
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        await runCommand(['check', jsFile]);
        

      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle absolute and relative paths', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'path-lens.js');
        const jsonFile = path.join(context.testDir, 'path-lens.json');
        
        const jsContent = 'function enhance(epi) { return epi; }';
        fs.writeFileSync(jsFile, jsContent);
        
        const base64Content = Buffer.from(jsContent).toString('base64');
        createMockLensFile(jsonFile, 'PathLens', true);
        
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        // Test with relative path
        await runCommand(['check', 'path-lens.js']);

        // Test with absolute path
        await runCommand(['check', jsFile]);

      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('content field validation', () => {
    it('should fail when lens has missing content field', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'missing-content.js');
        const jsonFile = path.join(context.testDir, 'missing-content.json');
        
        createMockEnhanceFile(jsFile);
        
        const lensData = {
          resourceType: 'Library',
          name: 'MissingContent',
          status: 'draft',
          // No content field
        };
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens has null content field', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'null-content.js');
        const jsonFile = path.join(context.testDir, 'null-content.json');
        
        createMockEnhanceFile(jsFile);
        
        const lensData = {
          resourceType: 'Library',
          name: 'NullContent',
          status: 'draft',
          content: null,
        };
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens has content as string', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'string-content.js');
        const jsonFile = path.join(context.testDir, 'string-content.json');
        
        createMockEnhanceFile(jsFile);
        
        const lensData = {
          resourceType: 'Library',
          name: 'StringContent',
          status: 'draft',
          content: 'invalid string',
        };
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens has empty content array', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'empty-array.js');
        const jsonFile = path.join(context.testDir, 'empty-array.json');
        
        createMockEnhanceFile(jsFile);
        
        const lensData = {
          resourceType: 'Library',
          name: 'EmptyArray',
          status: 'draft',
          content: [],
        };
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens has content with empty object', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'empty-object.js');
        const jsonFile = path.join(context.testDir, 'empty-object.json');
        
        createMockEnhanceFile(jsFile);
        
        const lensData = {
          resourceType: 'Library',
          name: 'EmptyObject',
          status: 'draft',
          content: [{}],
        };
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens has content missing data field', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsFile = path.join(context.testDir, 'no-data.js');
        const jsonFile = path.join(context.testDir, 'no-data.json');
        
        createMockEnhanceFile(jsFile);
        
        const lensData = {
          resourceType: 'Library',
          name: 'NoData',
          status: 'draft',
          content: [{ contentType: 'application/javascript' }],
        };
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(['check', jsFile]);
        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
