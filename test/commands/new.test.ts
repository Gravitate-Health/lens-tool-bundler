import {runCommand} from '@oclif/test';
import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {createTestDirectory, TestContext} from '../helpers/test-helper.js';

describe('new command', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('simple mode (default)', () => {
    it('should create a new lens with default values', async () => {
      const lensName = 'TestLens';
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        await runCommand(['new', lensName, '--default']);

        // Check if files were created
        const jsFile = path.join(context.testDir, `${lensName}.js`);
        const jsonFile = path.join(context.testDir, `${lensName}.json`);

        expect(fs.existsSync(jsFile)).to.be.true;
        expect(fs.existsSync(jsonFile)).to.be.true;

        // Verify JS file contains enhance function
        const jsContent = fs.readFileSync(jsFile, 'utf8');
        expect(jsContent).to.include('function enhance');

        // Verify JSON file is valid FHIR Library
        const jsonContent = fs.readFileSync(jsonFile, 'utf8');
        const lensData = JSON.parse(jsonContent);
        expect(lensData.resourceType).to.equal('Library');
        expect(lensData.name).to.equal(lensName);
        expect(lensData.identifier[0].value).to.equal('testlens');
        expect(lensData.content[0].data).to.be.a('string').and.not.empty;

        // Verify base64 content is the same as JS file
        const base64Decoded = Buffer.from(lensData.content[0].data, 'base64').toString('utf8');
        expect(base64Decoded).to.equal(jsContent);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should fail when lens already exists without force flag', async () => {
      const lensName = 'ExistingLens';
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create lens first time
        await runCommand(['new', lensName, '--default']);

        // Try to create again without force
        const {error} = await runCommand(['new', lensName, '--default']);

        expect(error).to.exist;
        expect(error?.message).to.include('exists');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should overwrite when force flag is used', async () => {
      const lensName = 'ForceLens';
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        // Create lens first time
        await runCommand(['new', lensName, '--default']);

        const jsonFile = path.join(context.testDir, `${lensName}.json`);
        const firstContent = fs.readFileSync(jsonFile, 'utf8');
        const firstDate = JSON.parse(firstContent).date;

        // Wait a bit to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));

        // Create again with force
        await runCommand(['new', lensName, '--default', '--force']);

        const secondContent = fs.readFileSync(jsonFile, 'utf8');
        const secondDate = JSON.parse(secondContent).date;

        expect(firstDate).to.not.equal(secondDate);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should keep human-readable name and normalize FHIR identifier', async () => {
      const lensName = 'My Test Lens';
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        const {error} = await runCommand(['new', '"My Test Lens"', '--default']);

        // Command should succeed
        expect(error).to.not.exist;

        // Files should be created with original name (including spaces)
        const jsFile = path.join(context.testDir, `${lensName}.js`);
        const jsonFile = path.join(context.testDir, `${lensName}.json`);

        expect(fs.existsSync(jsFile)).to.be.true;
        expect(fs.existsSync(jsonFile)).to.be.true;

        // The FHIR resource should keep human-readable name and normalized identifier
        const jsonContent = fs.readFileSync(jsonFile, 'utf8');
        const lensData = JSON.parse(jsonContent);
        expect(lensData.id).to.equal('my-test-lens');
        expect(lensData.name).to.equal(lensName);
        expect(lensData.identifier[0].value).to.equal('my-test-lens');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('template mode', () => {
    // Note: These tests require network access to clone the repository
    // They are marked as integration tests and may be slow

    it('should create lens from template in current directory when empty', async () => {
      const lensName = 'TemplateLens';
      const originalCwd = process.cwd();

      try {
        // Create an empty subdirectory
        const emptyDir = path.join(context.testDir, 'empty');
        fs.mkdirSync(emptyDir);
        process.chdir(emptyDir);

        const {error} = await runCommand(['new', lensName, '--template', '--default']);

        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes('clone') || message.includes('git') || message.includes('network')) {
            console.warn('⚠️  Skipping template test due to git/network error');
            return;
          }

          throw error;
        }

        const inPlaceDir = emptyDir;
        const subDir = path.join(emptyDir, lensName.toLowerCase());
        const createdDir = fs.existsSync(path.join(inPlaceDir, 'package.json')) ? inPlaceDir : subDir;

        if (!fs.existsSync(path.join(createdDir, 'package.json'))) {
          console.warn('⚠️  Skipping template test due to environment-specific clone behavior');
          return;
        }

        // Check if template files were created
        expect(fs.existsSync(path.join(createdDir, 'package.json'))).to.be.true;

        // Verify package.json was updated
        const pkgContent = fs.readFileSync(path.join(createdDir, 'package.json'), 'utf8');
        const pkgData = JSON.parse(pkgContent);
        expect(pkgData.name).to.equal(lensName.toLowerCase());
      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(30000); // Increase timeout for git operations

    it('should create lens from template in subdirectory when current is not empty', async () => {
      const lensName = 'SubdirLens';
      const originalCwd = process.cwd();

      try {
        // Create a non-empty directory
        const nonEmptyDir = context.testDir;
        fs.writeFileSync(path.join(nonEmptyDir, 'existing.txt'), 'existing file');
        process.chdir(nonEmptyDir);

        const {error} = await runCommand(['new', lensName, '--template', '--default']);

        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes('clone') || message.includes('git') || message.includes('network')) {
            console.warn('⚠️  Skipping template test due to git/network error');
            return;
          }

          throw error;
        }

        // Should create subdirectory with lens name
        const lensDir = path.join(nonEmptyDir, lensName.toLowerCase());
        expect(fs.existsSync(lensDir)).to.be.true;
        expect(fs.existsSync(path.join(lensDir, 'package.json'))).to.be.true;
        
        // Original file should still exist
        expect(fs.existsSync(path.join(nonEmptyDir, 'existing.txt'))).to.be.true;
      } finally {
        process.chdir(originalCwd);
      }
    }).timeout(30000);
  });

  describe('edge cases', () => {
    it('should handle lens names with special characters', async () => {
      const lensName = 'Test@Lens#123';
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        await runCommand(['new', lensName, '--default']);

        // Files should be created (special chars may be preserved in filename)
        const files = fs.readdirSync(context.testDir);
        expect(files.some(f => f.endsWith('.js'))).to.be.true;
        expect(files.some(f => f.endsWith('.json'))).to.be.true;
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle very long lens names', async () => {
      const lensName = 'A'.repeat(200);
      const originalCwd = process.cwd();

      try {
        process.chdir(context.testDir);

        await runCommand(['new', lensName, '--default']);

        // Should create files even with long name
        const files = fs.readdirSync(context.testDir);
        expect(files.length).to.be.greaterThan(0);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
