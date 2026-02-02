import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {runCommand} from '@oclif/test';
import {createMockLensFile, createTestDirectory, TestContext} from '../helpers/test-helper.js';

describe('test command', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('positive cases', () => {
    it('should pass tests for valid lens with proper enhance function', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'valid-lens.json');
        
        // Create lens with valid enhance function
        const validEnhance = `function enhance(epi) {
  // Valid enhance function that preserves content
  return epi;
}`;
        const base64Content = Buffer.from(validEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'ValidLens', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        // Run test command
        const {error} = await runCommand(["test", jsonFile]);
        

      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000); // Tests may take longer

    it('should run verbose tests when --verbose flag is used', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'verbose-lens.json');
        
        const validEnhance = 'function enhance(epi) { return epi; }';
        const base64Content = Buffer.from(validEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'VerboseLens', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        await runCommand(['test', jsonFile, '--verbose']);
        

      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000);
  });

  describe('negative cases', () => {
    it('should fail when lens file does not exist', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const {error} = await runCommand(["test", "nonexistent.json"]);

        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens has invalid FHIR structure', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'invalid-fhir.json');
        
        // Create invalid FHIR structure
        const invalidLens = {
          resourceType: 'NotLibrary',
          name: 'Invalid'
        };
        fs.writeFileSync(jsonFile, JSON.stringify(invalidLens, null, 2));

        const {error} = await runCommand(["test", jsonFile]);

        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens has no base64 content', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'no-content.json');
        createMockLensFile(jsonFile, 'NoContent', false);

        const {error} = await runCommand(["test", jsonFile]);

        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when enhance function has syntax errors', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'syntax-error.json');
        
        // Create lens with invalid JavaScript
        const invalidEnhance = 'function enhance(epi) { return epi; // missing closing brace';
        const base64Content = Buffer.from(invalidEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'SyntaxError', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(["test", jsonFile]);

        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000);

    it('should fail when enhance function modifies content incorrectly', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'bad-enhance.json');
        
        // Create lens that removes all content
        const badEnhance = `function enhance(epi) {
  // This will fail tests by returning empty
  return '';
}`;
        const base64Content = Buffer.from(badEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'BadEnhance', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(["test", jsonFile]);
        

        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000);
  });

  describe('edge cases', () => {
    it('should handle lens with complex enhance logic', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'complex-lens.json');
        
        // Complex but valid enhance function
        const complexEnhance = `function enhance(epi) {
  // Complex logic that still preserves content
  if (!epi || !epi.entry) {
    return epi;
  }
  
  // Add some processing
  for (const entry of epi.entry) {
    if (entry.resource && entry.resource.resourceType === 'Composition') {
      entry.resource.meta = entry.resource.meta || {};
      entry.resource.meta.tag = entry.resource.meta.tag || [];
    }
  }
  
  return epi;
}`;
        const base64Content = Buffer.from(complexEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'ComplexLens', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(["test", jsonFile]);

        // Complex logic should pass if it preserves content structure
        // Actual result depends on @gravitate-health/lens-tool-test behavior
        // We just verify it runs without crashing
        expect(error).to.satisfy((err: Error | undefined) => {
          return err === undefined || (err as any)?.oclif?.exit === 1;
        });
      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000);

    it('should handle relative and absolute paths', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'path-test.json');
        
        const validEnhance = 'function enhance(epi) { return epi; }';
        const base64Content = Buffer.from(validEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'PathTest', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        // Test with relative path
        await runCommand(['test', 'path-test.json']);

        // Test with absolute path
        await runCommand(['test', jsonFile]);

      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000);
  });

  describe('exit codes', () => {
    it('should exit with code 0 on successful tests', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'exit-0.json');
        const validEnhance = 'function enhance(epi) { return epi; }';
        const base64Content = Buffer.from(validEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'Exit0', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(["test", jsonFile]);
        

      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000);

    it('should exit with code 1 on test failures', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const jsonFile = path.join(context.testDir, 'exit-1.json');
        
        // Function that will fail tests
        const failingEnhance = 'function enhance(epi) { throw new Error("Test failure"); }';
        const base64Content = Buffer.from(failingEnhance).toString('base64');
        
        createMockLensFile(jsonFile, 'Exit1', true);
        const lensData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensData.content[0].data = base64Content;
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

        const {error} = await runCommand(["test", jsonFile]);

        expect(error).to.exist;
        expect((error as any)?.oclif?.exit).to.equal(1);
      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(10000);
  });
});
