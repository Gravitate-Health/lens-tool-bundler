import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {createMockEnhanceFile, createMockLensFile, createTestDirectory, readBase64ContentFromLens, TestContext} from '../helpers/test-helper.js';

/**
 * Tests for bundle and batch-bundle prioritization behavior
 * These tests verify that the commands correctly prioritize Libraries with the same name as JS files
 */
describe('bundle prioritization', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('single bundle command prioritization', () => {
    it('should update only matching lens when multiple lenses exist', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create lens1 pair
        const lens1Js = path.join(context.testDir, 'lens1.js');
        const lens1Json = path.join(context.testDir, 'lens1.json');
        createMockEnhanceFile(lens1Js, 'enhance', 'console.log("lens1 original");');
        createMockLensFile(lens1Json, 'lens1', true);

        // Create lens2 pair
        const lens2Js = path.join(context.testDir, 'lens2.js');
        const lens2Json = path.join(context.testDir, 'lens2.json');
        createMockEnhanceFile(lens2Js, 'enhance', 'console.log("lens2 original");');
        createMockLensFile(lens2Json, 'lens2', true);

        // Wait to ensure file system is ready
        await new Promise(resolve => setTimeout(resolve, 50));

        // Store original lens2 content for comparison
        const lens2OriginalContent = readBase64ContentFromLens(lens2Json);

        // Update lens1.js with new content
        const newContent = 'function enhance(epi) { console.log("lens1 UPDATED"); return epi; }';
        fs.writeFileSync(lens1Js, newContent);

        // Bundle lens1.js - should only update lens1.json
        await runCommand(['bundle', 'lens1.js', '--update']);

        // Small delay to ensure file is written
        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify lens1.json was updated
        const lens1Content = readBase64ContentFromLens(lens1Json);
        expect(lens1Content).to.include('lens1 UPDATED');

        // Verify lens2.json was NOT updated (still has original content from createMockLensFile)
        const lens2Content = readBase64ContentFromLens(lens2Json);
        expect(lens2Content).to.equal(lens2OriginalContent);
        expect(lens2Content).to.not.include('lens1 UPDATED');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should prioritize same-named json over differently-named json', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create test-lens.js
        const jsFile = path.join(context.testDir, 'test-lens.js');
        createMockEnhanceFile(jsFile, 'enhance', 'console.log("test content");');

        // Create test-lens.json (same name - should be prioritized)
        const matchingJson = path.join(context.testDir, 'test-lens.json');
        createMockLensFile(matchingJson, 'test-lens', true);

        // Create other-lens.json (different name - should be ignored)
        const otherJson = path.join(context.testDir, 'other-lens.json');
        createMockLensFile(otherJson, 'other-lens', true);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Update JS file
        const newContent = 'function enhance(epi) { console.log("UPDATED"); return epi; }';
        fs.writeFileSync(jsFile, newContent);

        // Bundle without specifying bundle - should find test-lens.json
        await runCommand(['bundle', 'test-lens.js', '--update']);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify test-lens.json was updated
        const matchingContent = readBase64ContentFromLens(matchingJson);
        expect(matchingContent).to.include('UPDATED');

        // Verify other-lens.json was NOT updated
        const otherContent = readBase64ContentFromLens(otherJson);
        expect(otherContent).to.not.include('UPDATED');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should use explicit --bundle flag to override prioritization', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create test-lens.js
        const jsFile = path.join(context.testDir, 'test-lens.js');
        createMockEnhanceFile(jsFile, 'enhance', 'console.log("test content");');

        // Create test-lens.json (same name)
        const matchingJson = path.join(context.testDir, 'test-lens.json');
        createMockLensFile(matchingJson, 'test-lens', true);

        // Create target-lens.json (different name)
        const targetJson = path.join(context.testDir, 'target-lens.json');
        createMockLensFile(targetJson, 'target-lens', true);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Update JS file
        const newContent = 'function enhance(epi) { console.log("EXPLICIT TARGET"); return epi; }';
        fs.writeFileSync(jsFile, newContent);

        // Bundle with explicit --bundle flag to target-lens.json
        await runCommand(['bundle', 'test-lens.js', '--update', '--bundle', 'target-lens.json']);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify target-lens.json was updated (even though test-lens.json exists)
        const targetContent = readBase64ContentFromLens(targetJson);
        expect(targetContent).to.include('EXPLICIT TARGET');

        // Verify test-lens.json was NOT updated
        const matchingContent = readBase64ContentFromLens(matchingJson);
        expect(matchingContent).to.not.include('EXPLICIT TARGET');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('batch-bundle prioritization', () => {
    it('should update both lenses with their respective code when pairs exist', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create lens1 pair
        const lens1Js = path.join(context.testDir, 'lens1.js');
        const lens1Json = path.join(context.testDir, 'lens1.json');
        createMockEnhanceFile(lens1Js, 'enhance', 'console.log("lens1 code");');
        createMockLensFile(lens1Json, 'lens1', true);

        // Create lens2 pair
        const lens2Js = path.join(context.testDir, 'lens2.js');
        const lens2Json = path.join(context.testDir, 'lens2.json');
        createMockEnhanceFile(lens2Js, 'enhance', 'console.log("lens2 code");');
        createMockLensFile(lens2Json, 'lens2', true);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Run batch-bundle
        const {error} = await runCommand(['batch-bundle', context.testDir]);
        expect(error).to.not.exist;

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify lens1.json has lens1 code
        const lens1Content = readBase64ContentFromLens(lens1Json);
        expect(lens1Content).to.include('lens1 code');
        expect(lens1Content).to.not.include('lens2 code');

        // Verify lens2.json has lens2 code
        const lens2Content = readBase64ContentFromLens(lens2Json);
        expect(lens2Content).to.include('lens2 code');
        expect(lens2Content).to.not.include('lens1 code');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should only update lens2 when lens1.js is missing (lens1.json has no exact match)', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create lens1.json WITHOUT lens1.js in a separate subdirectory
        // This ensures no fallback JS file from lens2.js
        const subDir1 = path.join(context.testDir, 'lens1-dir');
        fs.mkdirSync(subDir1);
        const lens1Json = path.join(subDir1, 'lens1.json');
        createMockLensFile(lens1Json, 'lens1', true);
        // Store original content for comparison
        const lens1OriginalContent = readBase64ContentFromLens(lens1Json);

        // Create lens2 pair (both js and json) in separate subdirectory
        const subDir2 = path.join(context.testDir, 'lens2-dir');
        fs.mkdirSync(subDir2);
        const lens2Js = path.join(subDir2, 'lens2.js');
        const lens2Json = path.join(subDir2, 'lens2.json');
        createMockEnhanceFile(lens2Js, 'enhance', 'console.log("lens2 updated");');
        createMockLensFile(lens2Json, 'lens2', true);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Run batch-bundle
        const {error} = await runCommand(['batch-bundle', context.testDir]);
        expect(error).to.not.exist;

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify lens1.json was NOT modified (no matching JS file, no fallback in same directory)
        const lens1FinalContent = readBase64ContentFromLens(lens1Json);
        expect(lens1FinalContent).to.equal(lens1OriginalContent);

        // Verify lens2.json WAS updated with lens2.js content
        const lens2Content = readBase64ContentFromLens(lens2Json);
        expect(lens2Content).to.include('lens2 updated');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should only update lens2 when lens1.json is missing', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create lens1.js WITHOUT lens1.json (orphan JS file)
        const lens1Js = path.join(context.testDir, 'lens1.js');
        createMockEnhanceFile(lens1Js, 'enhance', 'console.log("lens1 orphan");');

        // Create lens2 pair (both js and json)
        const lens2Js = path.join(context.testDir, 'lens2.js');
        const lens2Json = path.join(context.testDir, 'lens2.json');
        createMockEnhanceFile(lens2Js, 'enhance', 'console.log("lens2 paired");');
        createMockLensFile(lens2Json, 'lens2', true);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Run batch-bundle
        const {error} = await runCommand(['batch-bundle', context.testDir]);
        expect(error).to.not.exist;

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify lens1.json was NOT created (batch-bundle doesn't create new files)
        const lens1Json = path.join(context.testDir, 'lens1.json');
        expect(fs.existsSync(lens1Json)).to.be.false;

        // Verify lens2.json was updated
        const lens2Content = readBase64ContentFromLens(lens2Json);
        expect(lens2Content).to.include('lens2 paired');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle three lenses with mixed pairing scenarios', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create subdirectories to prevent fallback contamination
        const dir1 = path.join(context.testDir, 'dir1');
        const dir2 = path.join(context.testDir, 'dir2');
        const dir3 = path.join(context.testDir, 'dir3');
        fs.mkdirSync(dir1);
        fs.mkdirSync(dir2);
        fs.mkdirSync(dir3);

        // Create lens1 pair in dir1 (both exist - should update)
        const lens1Js = path.join(dir1, 'lens1.js');
        const lens1Json = path.join(dir1, 'lens1.json');
        createMockEnhanceFile(lens1Js, 'enhance', 'console.log("lens1 content");');
        createMockLensFile(lens1Json, 'lens1', true);

        // Create lens2.json WITHOUT lens2.js in dir2 (should skip)
        const lens2Json = path.join(dir2, 'lens2.json');
        createMockLensFile(lens2Json, 'lens2', true);
        const lens2OriginalContent = readBase64ContentFromLens(lens2Json);

        // Create lens3.js WITHOUT lens3.json in dir3 (should skip - no target)
        const lens3Js = path.join(dir3, 'lens3.js');
        createMockEnhanceFile(lens3Js, 'enhance', 'console.log("lens3 orphan");');

        await new Promise(resolve => setTimeout(resolve, 50));

        // Run batch-bundle
        const {error} = await runCommand(['batch-bundle', context.testDir]);
        expect(error).to.not.exist;

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify lens1.json was updated with lens1.js content
        const lens1Content = readBase64ContentFromLens(lens1Json);
        expect(lens1Content).to.include('lens1 content');

        // Verify lens2.json was NOT modified (no matching JS file in same directory)
        const lens2FinalContent = readBase64ContentFromLens(lens2Json);
        expect(lens2FinalContent).to.equal(lens2OriginalContent);

        // Verify lens3.json was NOT created
        const lens3Json = path.join(dir3, 'lens3.json');
        expect(fs.existsSync(lens3Json)).to.be.false;
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should correctly pair lenses in subdirectories', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create subdirectory structure
        const subDir = path.join(context.testDir, 'lenses');
        fs.mkdirSync(subDir);

        // Create lens pairs in subdirectory
        const lens1Js = path.join(subDir, 'lens1.js');
        const lens1Json = path.join(subDir, 'lens1.json');
        createMockEnhanceFile(lens1Js, 'enhance', 'console.log("subdir lens1");');
        createMockLensFile(lens1Json, 'lens1', true);

        const lens2Js = path.join(subDir, 'lens2.js');
        const lens2Json = path.join(subDir, 'lens2.json');
        createMockEnhanceFile(lens2Js, 'enhance', 'console.log("subdir lens2");');
        createMockLensFile(lens2Json, 'lens2', true);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Run batch-bundle on parent directory
        const {error} = await runCommand(['batch-bundle', context.testDir]);
        expect(error).to.not.exist;

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify both lenses in subdirectory were updated correctly
        const lens1Content = readBase64ContentFromLens(lens1Json);
        expect(lens1Content).to.include('subdir lens1');

        const lens2Content = readBase64ContentFromLens(lens2Json);
        expect(lens2Content).to.include('subdir lens2');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should not cross-contaminate lenses with similar names', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create lens pair
        const lensJs = path.join(context.testDir, 'lens.js');
        const lensJson = path.join(context.testDir, 'lens.json');
        createMockEnhanceFile(lensJs, 'enhance', 'console.log("lens code");');
        createMockLensFile(lensJson, 'lens', true);

        // Create lens-extended pair (similar name but different)
        const lensExtJs = path.join(context.testDir, 'lens-extended.js');
        const lensExtJson = path.join(context.testDir, 'lens-extended.json');
        createMockEnhanceFile(lensExtJs, 'enhance', 'console.log("lens-extended code");');
        createMockLensFile(lensExtJson, 'lens-extended', true);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Run batch-bundle
        const {error} = await runCommand(['batch-bundle', context.testDir]);
        expect(error).to.not.exist;

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify lens.json has only lens code
        const lensContent = readBase64ContentFromLens(lensJson);
        expect(lensContent).to.include('lens code');
        expect(lensContent).to.not.include('lens-extended code');

        // Verify lens-extended.json has only lens-extended code
        const lensExtContent = readBase64ContentFromLens(lensExtJson);
        expect(lensExtContent).to.include('lens-extended code');
        expect(lensExtContent).to.not.include('lens code');
        // Make sure it's not a substring match issue
        expect(lensExtContent).to.include('extended');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('bundle command with --name flag', () => {
    it('should create bundle with specified name when --bundle flag is used', async () => {
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create JS file
        const jsFile = path.join(context.testDir, 'source.js');
        createMockEnhanceFile(jsFile, 'enhance', 'console.log("source code");');

        await new Promise(resolve => setTimeout(resolve, 50));

        // Bundle with custom target filename
        await runCommand(['bundle', 'source.js', '--name', 'CustomLens', '--bundle', 'custom-target.json', '--default']);

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify custom-target.json was created
        const targetJson = path.join(context.testDir, 'custom-target.json');
        expect(fs.existsSync(targetJson)).to.be.true;

        // Verify content
        const targetContent = readBase64ContentFromLens(targetJson);
        expect(targetContent).to.include('source code');

        // Verify the lens name in the JSON is correct
        const jsonData = JSON.parse(fs.readFileSync(targetJson, 'utf8'));
        expect(jsonData.name).to.equal('CustomLens');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
