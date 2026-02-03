import {expect} from 'chai'
import * as fs from 'node:fs'
import * as path from 'node:path'

import * as dirController from '../../src/controllers/dir-controller.js'

describe('dir-controller', () => {
  describe('validateFHIRLens', () => {
    it('should validate a correct FHIR lens', () => {
      const validLens = {
        content: [{data: 'base64encodeddata'}],
        name: 'test-lens',
        resourceType: 'Library',
        status: 'active',
        url: 'https://example.com/lens',
      }

      const result = dirController.validateFHIRLens(validLens)

      expect(result.isValid).to.be.true
      expect(result.errors).to.be.empty
    })

    it('should reject lens with wrong resourceType', () => {
      const invalidLens = {
        content: [{data: 'base64encodeddata'}],
        name: 'test-lens',
        resourceType: 'Patient',
        status: 'active',
        url: 'https://example.com/lens',
      }

      const result = dirController.validateFHIRLens(invalidLens)

      expect(result.isValid).to.be.false
      expect(result.errors).to.include('resourceType must be "Library"')
    })

    it('should reject lens without name', () => {
      const invalidLens = {
        content: [{data: 'base64encodeddata'}],
        resourceType: 'Library',
        status: 'active',
        url: 'https://example.com/lens',
      }

      const result = dirController.validateFHIRLens(invalidLens)

      expect(result.isValid).to.be.false
      expect(result.errors).to.include('name is required and must be a string')
    })

    it('should reject lens without content', () => {
      const invalidLens = {
        name: 'test-lens',
        resourceType: 'Library',
        status: 'active',
        url: 'https://example.com/lens',
      }

      const result = dirController.validateFHIRLens(invalidLens)

      expect(result.isValid).to.be.false
      expect(result.errors).to.include('content must be an array')
    })

    it('should reject lens with empty content data', () => {
      const invalidLens = {
        content: [{contentType: 'application/javascript'}],
        name: 'test-lens',
        resourceType: 'Library',
        status: 'active',
        url: 'https://example.com/lens',
      }

      const result = dirController.validateFHIRLens(invalidLens)

      expect(result.isValid).to.be.false
      expect(result.errors).to.include('content must include at least one item with base64 encoded data')
    })

    it('should reject non-object input', () => {
      const result = dirController.validateFHIRLens(null as any)

      expect(result.isValid).to.be.false
      expect(result.errors).to.include('Lens must be a JSON object')
    })
  })

  describe('jsToBase64', () => {
    const testDir = path.join(process.cwd(), 'test', 'fixtures')
    const testFile = path.join(testDir, 'test-enhance.js')

    before(() => {
      // Create test fixtures directory if it doesn't exist
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, {recursive: true})
      }

      // Create a test JavaScript file
      fs.writeFileSync(
        testFile,
        `function enhance(content) {
  return content;
}`,
      )
    })

    after(() => {
      // Clean up test file
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile)
      }
    })

    it('should convert JavaScript file to base64', () => {
      const base64 = dirController.jsToBase64(testFile)

      expect(base64).to.be.a('string')
      expect(base64).to.not.be.empty

      // Decode and verify content
      const decoded = Buffer.from(base64, 'base64').toString('utf8')
      expect(decoded).to.include('function enhance')
    })

    it('should produce valid base64 encoding', () => {
      const base64 = dirController.jsToBase64(testFile)

      // Base64 should only contain valid characters
      expect(base64).to.match(/^[A-Za-z0-9+/=]+$/)
    })

    it('should be reversible', () => {
      const originalContent = fs.readFileSync(testFile, 'utf8')
      const base64 = dirController.jsToBase64(testFile)
      const decoded = Buffer.from(base64, 'base64').toString('utf8')

      expect(decoded).to.equal(originalContent)
    })
  })

  describe('findJsonFiles', () => {
    const testDir = path.join(process.cwd(), 'test', 'fixtures', 'find-test')

    before(() => {
      // Create test directory structure
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, {recursive: true})
      }

      fs.writeFileSync(path.join(testDir, 'test1.json'), '{}')
      fs.writeFileSync(path.join(testDir, 'test2.json'), '{}')
      fs.writeFileSync(path.join(testDir, 'test.js'), 'console.log("test")')

      const subDir = path.join(testDir, 'subdir')
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir)
      }

      fs.writeFileSync(path.join(subDir, 'test3.json'), '{}')
    })

    after(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, {force: true, recursive: true})
      }
    })

    it('should find all JSON files recursively', () => {
      const jsonFiles = dirController.findJsonFiles(testDir)

      expect(jsonFiles).to.be.an('array')
      expect(jsonFiles).to.have.lengthOf(3)
      expect(jsonFiles.every((f) => f.endsWith('.json'))).to.be.true
    })

    it('should not include non-JSON files', () => {
      const jsonFiles = dirController.findJsonFiles(testDir)

      expect(jsonFiles.some((f) => f.endsWith('.js'))).to.be.false
    })

    it('should include files from subdirectories', () => {
      const jsonFiles = dirController.findJsonFiles(testDir)
      const hasSubdirFile = jsonFiles.some((f) => f.includes('subdir'))

      expect(hasSubdirFile).to.be.true
    })
  })

  describe('findEnhanceFiles', () => {
    const testDir = path.join(process.cwd(), 'test', 'fixtures', 'enhance-test')

    before(() => {
      // Create test directory structure
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, {recursive: true})
      }

      // File with enhance function
      fs.writeFileSync(
        path.join(testDir, 'valid-enhance.js'),
        `function enhance(content) { return content; }`,
      )

      // File with const enhance
      fs.writeFileSync(
        path.join(testDir, 'const-enhance.js'),
        `const enhance = (content) => content;`,
      )

      // File without enhance function
      fs.writeFileSync(
        path.join(testDir, 'no-enhance.js'),
        `function process(content) { return content; }`,
      )
    })

    after(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, {force: true, recursive: true})
      }
    })

    it('should find files with enhance function', () => {
      const enhanceFiles = dirController.findEnhanceFiles(testDir)

      expect(enhanceFiles.fallback[testDir]).to.be.an('array')
      expect(enhanceFiles.fallback[testDir]).to.have.lengthOf(2)
    })

    it('should create exact match mappings', () => {
      const enhanceFiles = dirController.findEnhanceFiles(testDir)
      const validEnhanceJson = path.join(testDir, 'valid-enhance.json')

      expect(enhanceFiles.exact[validEnhanceJson]).to.include('valid-enhance.js')
    })

    it('should not include files without enhance function', () => {
      const enhanceFiles = dirController.findEnhanceFiles(testDir)
      const noEnhanceFile = path.join(testDir, 'no-enhance.js')

      const hasNoEnhance = enhanceFiles.fallback[testDir]?.some((f) => f === noEnhanceFile)

      expect(hasNoEnhance).to.be.false
    })
  })

  describe('exclusion functionality', () => {
    describe('isExcluded', () => {
      it('should return true for paths matching exclusion patterns', () => {
        const exclusions = [/node_modules/, /\.test\./]
        
        expect(dirController.isExcluded('node_modules', exclusions)).to.be.true
        expect(dirController.isExcluded('src/node_modules', exclusions)).to.be.true
        expect(dirController.isExcluded('file.test.js', exclusions)).to.be.true
      })

      it('should return false for paths not matching exclusion patterns', () => {
        const exclusions = [/node_modules/, /\.test\./]
        
        expect(dirController.isExcluded('src/index.js', exclusions)).to.be.false
        expect(dirController.isExcluded('package.json', exclusions)).to.be.false
      })

      it('should handle empty exclusion list', () => {
        expect(dirController.isExcluded('anything', [])).to.be.false
      })
    })

    describe('DEFAULT_EXCLUSIONS', () => {
      it('should include node_modules', () => {
        expect(dirController.DEFAULT_EXCLUSIONS.some(p => p.test('node_modules'))).to.be.true
      })

      it('should include package.json', () => {
        expect(dirController.DEFAULT_EXCLUSIONS.some(p => p.test('package.json'))).to.be.true
      })

      it('should include package-lock.json', () => {
        expect(dirController.DEFAULT_EXCLUSIONS.some(p => p.test('package-lock.json'))).to.be.true
      })
    })

    describe('findJsonFiles with exclusions', () => {
      const testDir = path.join(process.cwd(), 'test', 'fixtures', 'exclusion-test')

      before(() => {
        // Create test directory structure
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, {recursive: true})
        }

        fs.writeFileSync(path.join(testDir, 'lens.json'), '{}')
        fs.writeFileSync(path.join(testDir, 'test.json'), '{}')
        fs.writeFileSync(path.join(testDir, 'draft.json'), '{}')
        fs.writeFileSync(path.join(testDir, 'package.json'), '{}')

        // Create node_modules directory that should be excluded
        const nodeModules = path.join(testDir, 'node_modules')
        if (!fs.existsSync(nodeModules)) {
          fs.mkdirSync(nodeModules)
        }
        fs.writeFileSync(path.join(nodeModules, 'should-not-appear.json'), '{}')

        // Create test directory that should be excluded
        const testSubDir = path.join(testDir, 'test')
        if (!fs.existsSync(testSubDir)) {
          fs.mkdirSync(testSubDir)
        }
        fs.writeFileSync(path.join(testSubDir, 'test-lens.json'), '{}')
      })

      after(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, {force: true, recursive: true})
        }
      })

      it('should exclude files matching default exclusions', () => {
        const jsonFiles = dirController.findJsonFiles(testDir)

        expect(jsonFiles.some(f => f.includes('package.json'))).to.be.false
        expect(jsonFiles.some(f => f.includes('node_modules'))).to.be.false
      })

      it('should exclude directories matching patterns', () => {
        const jsonFiles = dirController.findJsonFiles(testDir)

        expect(jsonFiles.some(f => f.includes('should-not-appear.json'))).to.be.false
      })

      it('should support custom exclusion patterns', () => {
        const exclusions = [...dirController.DEFAULT_EXCLUSIONS, /test/, /draft/]
        const jsonFiles = dirController.findJsonFiles(testDir, exclusions)

        expect(jsonFiles.some(f => f.includes('test.json'))).to.be.false
        expect(jsonFiles.some(f => f.includes('draft.json'))).to.be.false
        expect(jsonFiles.some(f => f.includes('test-lens.json'))).to.be.false
        expect(jsonFiles.some(f => f.includes('lens.json'))).to.be.true
      })

      it('should support multiple custom exclusions', () => {
        const exclusions = [
          ...dirController.DEFAULT_EXCLUSIONS,
          /.*\.test\./,
          /.*\.draft\./,
          /^archive/
        ]
        const jsonFiles = dirController.findJsonFiles(testDir, exclusions)

        // Should still find lens.json
        expect(jsonFiles.some(f => f.includes('lens.json'))).to.be.true
      })
    })

    describe('findEnhanceFiles with exclusions', () => {
      const testDir = path.join(process.cwd(), 'test', 'fixtures', 'enhance-exclusion-test')

      before(() => {
        // Create test directory structure
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, {recursive: true})
        }

        fs.writeFileSync(
          path.join(testDir, 'lens.js'),
          `function enhance(content) { return content; }`,
        )

        fs.writeFileSync(
          path.join(testDir, 'test.enhance.js'),
          `function enhance(content) { return content; }`,
        )

        // Create node_modules with enhance file
        const nodeModules = path.join(testDir, 'node_modules')
        if (!fs.existsSync(nodeModules)) {
          fs.mkdirSync(nodeModules)
        }
        fs.writeFileSync(
          path.join(nodeModules, 'lib.js'),
          `function enhance(content) { return content; }`,
        )
      })

      after(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, {force: true, recursive: true})
        }
      })

      it('should exclude files in node_modules by default', () => {
        const enhanceFiles = dirController.findEnhanceFiles(testDir)
        const nodeModulesPath = path.join(testDir, 'node_modules')

        expect(enhanceFiles.fallback[nodeModulesPath]).to.be.undefined
      })

      it('should support custom exclusion patterns', () => {
        const exclusions = [...dirController.DEFAULT_EXCLUSIONS, /test\.enhance/]
        const enhanceFiles = dirController.findEnhanceFiles(testDir, exclusions)

        expect(enhanceFiles.fallback[testDir]).to.be.an('array')
        expect(enhanceFiles.fallback[testDir].some(f => f.includes('test.enhance.js'))).to.be.false
        expect(enhanceFiles.fallback[testDir].some(f => f.includes('lens.js'))).to.be.true
      })
    })
  })
})
