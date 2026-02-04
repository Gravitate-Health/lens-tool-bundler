import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as dirController from '../../src/controllers/dir-controller.js';
import {createMockEnhanceFile, createMockLensFile, createPackageJson, createTestDirectory, TestContext} from '../helpers/test-helper.js';

/**
 * Integration tests for batch operations and ls commands
 * These tests verify the discovery, validation, and batch processing of multiple lenses
 */
describe('batch operations integration', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('multiple lens discovery', () => {
    it('should discover multiple lenses in a directory', async () => {
      // Create multiple lens pairs
      const lensNames = ['lens-one', 'lens-two', 'lens-three'];
      
      for (const name of lensNames) {
        const jsFile = path.join(context.testDir, `${name}.js`);
        const jsonFile = path.join(context.testDir, `${name}.json`);
        
        createMockEnhanceFile(jsFile);
        createMockLensFile(jsonFile, name, true);
      }

      // Discover lenses
      const lenses = await dirController.discoverLenses(context.testDir);
      
      expect(lenses).to.have.lengthOf(3);
      expect(lenses.map(l => l.name)).to.include.members(lensNames);
    });

    it('should discover lenses in subdirectories', async () => {
      // Create nested directory structure
      const subDir1 = path.join(context.testDir, 'category1');
      const subDir2 = path.join(context.testDir, 'category2');
      
      fs.mkdirSync(subDir1);
      fs.mkdirSync(subDir2);

      // Create lenses in different directories
      createMockEnhanceFile(path.join(context.testDir, 'root-lens.js'));
      createMockLensFile(path.join(context.testDir, 'root-lens.json'), 'RootLens', true);

      createMockEnhanceFile(path.join(subDir1, 'cat1-lens.js'));
      createMockLensFile(path.join(subDir1, 'cat1-lens.json'), 'Cat1Lens', true);

      createMockEnhanceFile(path.join(subDir2, 'cat2-lens.js'));
      createMockLensFile(path.join(subDir2, 'cat2-lens.json'), 'Cat2Lens', true);

      const lenses = await dirController.discoverLenses(context.testDir);
      
      expect(lenses).to.have.lengthOf(3);
    });

    it('should handle lenses without matching JS files', async () => {
      // Create lens JSON without JS file
      createMockLensFile(path.join(context.testDir, 'orphan-lens.json'), 'OrphanLens', true);

      // Create lens with JS file
      createMockEnhanceFile(path.join(context.testDir, 'normal-lens.js'));
      createMockLensFile(path.join(context.testDir, 'normal-lens.json'), 'NormalLens', true);

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should discover both
      expect(lenses).to.have.lengthOf(2);
    });

    it('should handle JS files without matching JSON files', async () => {
      // Create JS file without JSON
      createMockEnhanceFile(path.join(context.testDir, 'orphan.js'));

      // Create normal pair
      createMockEnhanceFile(path.join(context.testDir, 'normal.js'));
      createMockLensFile(path.join(context.testDir, 'normal.json'), 'Normal', true);

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should only discover the one with JSON
      expect(lenses).to.have.lengthOf(1);
      expect(lenses[0].name).to.equal('Normal');
    });
  });

  describe('exact match vs fallback pairing', () => {
    it('should prioritize exact name matches for JS-JSON pairing', async () => {
      const dir = context.testDir;

      // Create multiple JS files with enhance function
      createMockEnhanceFile(path.join(dir, 'my-lens.js'), 'enhance');
      createMockEnhanceFile(path.join(dir, 'other-enhance.js'), 'enhance');
      
      // Create JSON file
      createMockLensFile(path.join(dir, 'my-lens.json'), 'MyLens', false);

      const enhanceFiles = dirController.findEnhanceFiles(dir);
      
      // Should have exact match for my-lens.json → my-lens.js
      const exactMatch = enhanceFiles.exact[path.join(dir, 'my-lens.json')];
      expect(exactMatch).to.equal(path.join(dir, 'my-lens.js'));
    });

    it('should use fallback when no exact match exists', async () => {
      const dir = context.testDir;

      // Create JS file with different name
      createMockEnhanceFile(path.join(dir, 'enhance-impl.js'), 'enhance');
      
      // Create JSON file with different name
      createMockLensFile(path.join(dir, 'my-lens.json'), 'MyLens', false);

      const enhanceFiles = dirController.findEnhanceFiles(dir);
      
      // No exact match
      expect(enhanceFiles.exact[path.join(dir, 'my-lens.json')]).to.be.undefined;
      
      // But should have fallback for the directory
      expect(enhanceFiles.fallback[dir]).to.include(path.join(dir, 'enhance-impl.js'));
    });

    it('should list all JS files with enhance functions in directory', async () => {
      const dir = context.testDir;

      // Create multiple JS files with enhance function
      createMockEnhanceFile(path.join(dir, 'enhance1.js'));
      createMockEnhanceFile(path.join(dir, 'enhance2.js'));
      createMockEnhanceFile(path.join(dir, 'enhance3.js'));
      
      // Create JS file without enhance function
      fs.writeFileSync(path.join(dir, 'not-enhance.js'), 'function other() { return "test"; }');

      const enhanceFiles = dirController.findEnhanceFiles(dir);
      
      const allEnhanceFiles = enhanceFiles.fallback[dir] || [];
      expect(allEnhanceFiles).to.have.lengthOf(3);
      expect(allEnhanceFiles.map(f => path.basename(f))).to.include.members([
        'enhance1.js',
        'enhance2.js',
        'enhance3.js'
      ]);
    });
  });

  describe('validation of multiple lenses', () => {
    it('should validate all lenses and report results', async () => {
      // Create mix of valid and invalid lenses
      
      // Valid lens
      createMockEnhanceFile(path.join(context.testDir, 'valid.js'));
      createMockLensFile(path.join(context.testDir, 'valid.json'), 'Valid', true);

      // Invalid lens (missing resourceType)
      const invalidLens = {
        name: 'Invalid',
        status: 'draft'
      };
      fs.writeFileSync(
        path.join(context.testDir, 'invalid.json'),
        JSON.stringify(invalidLens, null, 2)
      );

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should only discover valid lens
      expect(lenses).to.have.lengthOf(1);
      expect(lenses[0].name).to.equal('Valid');
    });

    it('should handle lenses with missing base64 content', async () => {
      const dir = context.testDir;

      // Create lens without base64 but with JS file
      createMockEnhanceFile(path.join(dir, 'needs-enhance.js'));
      createMockLensFile(path.join(dir, 'needs-enhance.json'), 'NeedsEnhance', false);

      const lenses = await dirController.discoverLenses(dir);
      
      // Should enhance it automatically
      expect(lenses).to.have.lengthOf(1);
      expect(lenses[0].hasBase64).to.be.true;
      expect(lenses[0].enhancedWithJs).to.exist;
    });
  });

  describe('batch processing scenarios', () => {
    it('should process all lenses in a project directory', async () => {
      // Simulate a real project with multiple lenses
      const lensData = [
        { name: 'patient-view-lens', version: '1.0.0' },
        { name: 'practitioner-lens', version: '1.0.0' },
        { name: 'medication-lens', version: '1.0.0' }
      ];

      for (const lens of lensData) {
        const jsFile = path.join(context.testDir, `${lens.name}.js`);
        const jsonFile = path.join(context.testDir, `${lens.name}.json`);
        
        createMockEnhanceFile(jsFile);
        createMockLensFile(jsonFile, lens.name, true);
        
        // Add version to JSON
        const lensJson = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        lensJson.version = lens.version;
        fs.writeFileSync(jsonFile, JSON.stringify(lensJson, null, 2));
      }

      // Discover all
      const discovered = await dirController.discoverLenses(context.testDir);
      
      expect(discovered).to.have.lengthOf(3);
      
      // Verify all have proper structure
      for (const lens of discovered) {
        expect(lens.hasBase64).to.be.true;
        expect(lens.version).to.equal('1.0.0');
        expect(lens.status).to.be.a('string');
      }
    });

    it('should handle mixed content (lenses and other files)', async () => {
      // Create lenses
      createMockEnhanceFile(path.join(context.testDir, 'lens1.js'));
      createMockLensFile(path.join(context.testDir, 'lens1.json'), 'Lens1', true);

      // Create other files that should be ignored
      fs.writeFileSync(path.join(context.testDir, 'README.md'), '# README');
      fs.writeFileSync(path.join(context.testDir, 'package.json'), '{"name": "test"}');
      fs.writeFileSync(path.join(context.testDir, 'config.json'), '{"setting": true}');
      fs.writeFileSync(path.join(context.testDir, 'util.js'), 'function util() {}');

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should only discover actual lenses
      expect(lenses).to.have.lengthOf(1);
    });
  });

  describe('base64 encoding validation', () => {
    it('should correctly encode and decode content for all lenses', async () => {
      const testCases = [
        { name: 'simple', content: 'function enhance(epi) { return epi; }' },
        { name: 'complex', content: 'function enhance(epi) {\n  // Multi-line\n  const result = epi;\n  return result;\n}' },
        { name: 'unicode', content: 'function enhance(epi) { const msg = "Hello 世界 🌍"; return epi; }' }
      ];

      for (const test of testCases) {
        const jsFile = path.join(context.testDir, `${test.name}.js`);
        const jsonFile = path.join(context.testDir, `${test.name}.json`);
        
        fs.writeFileSync(jsFile, test.content);
        createMockLensFile(jsonFile, test.name, false);
      }

      const lenses = await dirController.discoverLenses(context.testDir);
      
      expect(lenses).to.have.lengthOf(testCases.length);

      // Verify each lens has correct base64 encoding
      for (let i = 0; i < testCases.length; i++) {
        const lens = lenses.find(l => l.name === testCases[i].name);
        expect(lens).to.exist;
        
        if (lens && Array.isArray(lens.lens.content)) {
          const base64Data = lens.lens.content[0].data;
          const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
          expect(decoded).to.equal(testCases[i].content);
        }
      }
    });
  });

  describe('file system operations', () => {
    it('should find all JSON files recursively', () => {
      // Create nested structure
      fs.mkdirSync(path.join(context.testDir, 'level1'));
      fs.mkdirSync(path.join(context.testDir, 'level1', 'level2'));

      fs.writeFileSync(path.join(context.testDir, 'root.json'), '{}');
      fs.writeFileSync(path.join(context.testDir, 'level1', 'l1.json'), '{}');
      fs.writeFileSync(path.join(context.testDir, 'level1', 'level2', 'l2.json'), '{}');

      const jsonFiles = dirController.findJsonFiles(context.testDir);
      
      expect(jsonFiles).to.have.lengthOf(3);
    });

    it('should handle empty directories', () => {
      const jsonFiles = dirController.findJsonFiles(context.testDir);
      const enhanceFiles = dirController.findEnhanceFiles(context.testDir);
      
      expect(jsonFiles).to.have.lengthOf(0);
      expect(Object.keys(enhanceFiles.exact)).to.have.lengthOf(0);
      expect(Object.keys(enhanceFiles.fallback)).to.have.lengthOf(0);
    });

    it('should handle directories with only non-lens files', async () => {
      fs.writeFileSync(path.join(context.testDir, 'data.json'), '{"not": "a lens"}');
      fs.writeFileSync(path.join(context.testDir, 'script.js'), 'console.log("test");');

      const lenses = await dirController.discoverLenses(context.testDir);
      
      expect(lenses).to.have.lengthOf(0);
    });
  });

  describe('edge cases in batch operations', () => {
    it('should handle very large number of lenses', async () => {
      // Create 50 lenses
      const count = 50;
      
      for (let i = 0; i < count; i++) {
        const name = `lens-${i.toString().padStart(3, '0')}`;
        createMockEnhanceFile(path.join(context.testDir, `${name}.js`));
        createMockLensFile(path.join(context.testDir, `${name}.json`), name, true);
      }

      const lenses = await dirController.discoverLenses(context.testDir);
      
      expect(lenses).to.have.lengthOf(count);
    });

    it('should handle lenses with identical content', async () => {
      const content = 'function enhance(epi) { return epi; }';
      
      // Create 3 lenses with same JS content
      for (let i = 1; i <= 3; i++) {
        const name = `duplicate-${i}`;
        fs.writeFileSync(path.join(context.testDir, `${name}.js`), content);
        createMockLensFile(path.join(context.testDir, `${name}.json`), name, false);
      }

      const lenses = await dirController.discoverLenses(context.testDir);
      
      expect(lenses).to.have.lengthOf(3);
      
      // All should have same base64 content
      const base64Contents = lenses.map(l => 
        Array.isArray(l.lens.content) ? l.lens.content[0].data : null
      );
      
      expect(base64Contents[0]).to.equal(base64Contents[1]);
      expect(base64Contents[1]).to.equal(base64Contents[2]);
    });

    it('should handle file names with special characters', async () => {
      // Note: Some special chars may not be valid in filenames on all systems
      const names = ['lens-with-dash', 'lens_with_underscore', 'lens.with.dots'];
      
      for (const name of names) {
        try {
          createMockEnhanceFile(path.join(context.testDir, `${name}.js`));
          createMockLensFile(path.join(context.testDir, `${name}.json`), name, true);
        } catch {
          // Skip if filename not supported on this system
          continue;
        }
      }

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should discover all successfully created lenses
      expect(lenses.length).to.be.greaterThan(0);
    });
  });

  describe('content field validation and repair', () => {
    it('should handle lens with completely missing content field', async () => {
      // Create lens JSON without content field at all
      const lensData = {
        resourceType: 'Library',
        name: 'MissingContent',
        status: 'draft',
        // No content field
      };
      
      const jsFile = path.join(context.testDir, 'missing-content.js');
      const jsonFile = path.join(context.testDir, 'missing-content.json');
      
      createMockEnhanceFile(jsFile);
      fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should discover and fix the lens
      expect(lenses).to.have.lengthOf(1);
      expect(lenses[0].hasBase64).to.be.true;
      expect(lenses[0].lens.content).to.be.an('array');
      const content = lenses[0].lens.content as Array<Record<string, unknown>>;
      expect(content).to.have.lengthOf(1);
      expect(content[0].data).to.be.a('string').and.not.empty;
    });

    it('should handle lens with null content field', async () => {
      const lensData = {
        resourceType: 'Library',
        name: 'NullContent',
        status: 'draft',
        content: null,
      };
      
      const jsFile = path.join(context.testDir, 'null-content.js');
      const jsonFile = path.join(context.testDir, 'null-content.json');
      
      createMockEnhanceFile(jsFile);
      fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

      const lenses = await dirController.discoverLenses(context.testDir);
      
      expect(lenses).to.have.lengthOf(1);
      expect(lenses[0].lens.content).to.be.an('array');
      const content = lenses[0].lens.content as Array<Record<string, unknown>>;
      expect(content[0].data).to.exist;
    });

    it('should handle lens with content as string instead of array', async () => {
      const lensData = {
        resourceType: 'Library',
        name: 'StringContent',
        status: 'draft',
        content: 'invalid string content',
      };
      
      const jsFile = path.join(context.testDir, 'string-content.js');
      const jsonFile = path.join(context.testDir, 'string-content.json');
      
      createMockEnhanceFile(jsFile);
      fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should convert string to proper array
      expect(lenses).to.have.lengthOf(1);
      expect(lenses[0].lens.content).to.be.an('array');
      const content = lenses[0].lens.content as Array<Record<string, unknown>>;
      expect(content[0].data).to.be.a('string');
    });

    it('should handle lens with content as object instead of array', async () => {
      const lensData = {
        resourceType: 'Library',
        name: 'ObjectContent',
        status: 'draft',
        content: { data: 'old-base64', contentType: 'application/javascript' },
      };
      
      const jsFile = path.join(context.testDir, 'object-content.js');
      const jsonFile = path.join(context.testDir, 'object-content.json');
      
      createMockEnhanceFile(jsFile);
      fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should convert object to proper array
      expect(lenses).to.have.lengthOf(1);
      expect(lenses[0].lens.content).to.be.an('array');
      const content = lenses[0].lens.content as Array<Record<string, unknown>>;
      expect(content[0].data).to.be.a('string');
    });

    it('should handle lens with empty array content', async () => {
      const lensData = {
        resourceType: 'Library',
        name: 'EmptyArrayContent',
        status: 'draft',
        content: [],
      };
      
      const jsFile = path.join(context.testDir, 'empty-array.js');
      const jsonFile = path.join(context.testDir, 'empty-array.json');
      
      createMockEnhanceFile(jsFile);
      fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should add content to empty array
      expect(lenses).to.have.lengthOf(1);
      const content = lenses[0].lens.content as Array<Record<string, unknown>>;
      expect(content).to.have.lengthOf(1);
      expect(content[0].data).to.exist;
    });

    it('should handle lens with array containing empty object', async () => {
      const lensData = {
        resourceType: 'Library',
        name: 'EmptyObjectContent',
        status: 'draft',
        content: [{}],
      };
      
      const jsFile = path.join(context.testDir, 'empty-object.js');
      const jsonFile = path.join(context.testDir, 'empty-object.json');
      
      createMockEnhanceFile(jsFile);
      fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should add data to empty object
      expect(lenses).to.have.lengthOf(1);
      const content = lenses[0].lens.content as Array<Record<string, unknown>>;
      expect(content[0].data).to.be.a('string').and.not.empty;
    });

    it('should handle lens with content array missing data field', async () => {
      const lensData = {
        resourceType: 'Library',
        name: 'MissingDataField',
        status: 'draft',
        content: [{ contentType: 'application/javascript' }],
      };
      
      const jsFile = path.join(context.testDir, 'missing-data.js');
      const jsonFile = path.join(context.testDir, 'missing-data.json');
      
      createMockEnhanceFile(jsFile);
      fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // Should add data field
      expect(lenses).to.have.lengthOf(1);
      const content = lenses[0].lens.content as Array<Record<string, unknown>>;
      expect(content[0].data).to.be.a('string').and.not.empty;
      expect(content[0].contentType).to.equal('application/javascript');
    });

    it('should handle multiple lenses with various content issues', async () => {
      // Create multiple lenses with different content issues
      const testCases = [
        { name: 'missing1', content: undefined },
        { name: 'missing2', content: null },
        { name: 'string1', content: 'invalid' },
        { name: 'empty1', content: [] },
        { name: 'valid1', content: [{ data: 'dmFsaWQ=' }] },
      ];

      for (const testCase of testCases) {
        const jsFile = path.join(context.testDir, `${testCase.name}.js`);
        const jsonFile = path.join(context.testDir, `${testCase.name}.json`);
        
        createMockEnhanceFile(jsFile);
        
        const lensData: any = {
          resourceType: 'Library',
          name: testCase.name,
          status: 'draft',
        };
        
        if (testCase.content !== undefined) {
          lensData.content = testCase.content;
        }
        
        fs.writeFileSync(jsonFile, JSON.stringify(lensData, null, 2));
      }

      const lenses = await dirController.discoverLenses(context.testDir);
      
      // All should be discovered and fixed
      expect(lenses).to.have.lengthOf(5);
      
      // All should have valid content arrays
      for (const lens of lenses) {
        expect(lens.lens.content).to.be.an('array');
        const content = lens.lens.content as Array<Record<string, unknown>>;
        expect(content).to.have.lengthOf.at.least(1);
        expect(content[0].data).to.be.a('string').and.not.empty;
      }
    });
  });
});
