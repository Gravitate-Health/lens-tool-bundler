import {expect} from 'chai'

import {LensFhirResource} from '../../src/models/lens-fhir-resource.js'

describe('LensFhirResource', () => {
  const sampleBase64 = 'ZnVuY3Rpb24gZW5oYW5jZSgpIHsgcmV0dXJuICdoZWxsbyc7IH0='

  describe('defaultValues', () => {
    it('should create a lens with default values', () => {
      const lens = LensFhirResource.defaultValues('test-lens', sampleBase64)

      expect(lens.resourceType).to.equal('Library')
      expect(lens.name).to.equal('test-lens')
      expect(lens.id).to.equal('test-lens')
      expect(lens.status).to.equal('draft')
      expect(lens.experimental).to.be.true
      expect(lens.description).to.equal('Description to be specified')
      expect(lens.purpose).to.equal('Purpose yo be specified')
      expect(lens.usage).to.equal('Usage to be specified')
      expect(lens.version).to.equal('0.0.1')
      expect(lens.publisher).to.equal('Gravitate Health Project - UPM Team')
      expect(lens.content).to.be.an('array').with.lengthOf(1)
      expect(lens.content[0].data).to.equal(sampleBase64)
      expect(lens.content[0].contentType).to.equal('application/javascript')
    })

    it('should normalize lens name to lowercase with hyphens for ID', () => {
      const lens = LensFhirResource.defaultValues('My Test Lens', sampleBase64)

      expect(lens.name).to.equal('My Test Lens')
      expect(lens.id).to.equal('my-test-lens')
    })

    it('should set date to ISO 8601 format', () => {
      const lens = LensFhirResource.defaultValues('test-lens', sampleBase64)

      expect(lens.date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('interactiveValues', () => {
    it('should create a lens with interactive values', () => {
      const lens = LensFhirResource.interactiveValues(
        'interactive-lens',
        'Test description',
        'Test purpose',
        'Test usage',
        sampleBase64,
      )

      expect(lens.resourceType).to.equal('Library')
      expect(lens.name).to.equal('interactive-lens')
      expect(lens.description).to.equal('Test description')
      expect(lens.purpose).to.equal('Test purpose')
      expect(lens.usage).to.equal('Test usage')
      expect(lens.content[0].data).to.equal(sampleBase64)
    })
  })

  describe('fromPackageJson', () => {
    it('should create a lens from package.json data', () => {
      const packageJson = {
        author: 'Test Author',
        description: 'Package description',
        license: 'MIT',
        name: 'test-package',
        version: '1.2.3',
      }

      const lens = LensFhirResource.fromPackageJson(packageJson, sampleBase64)

      expect(lens.name).to.equal('test-package')
      expect(lens.version).to.equal('1.2.3')
      expect(lens.description).to.equal('Package description')
      expect(lens.publisher).to.equal('Test Author')
      expect(lens.copyright).to.equal('Licensed under MIT')
    })

    it('should handle author as object', () => {
      const packageJson = {
        author: {
          email: 'test@example.com',
          name: 'Test Author',
          url: 'https://example.com',
        },
        name: 'test-package',
      }

      const lens = LensFhirResource.fromPackageJson(packageJson, sampleBase64)

      expect(lens.publisher).to.equal('Test Author')
      expect(lens.contact).to.be.an('array').with.lengthOf(1)
      expect(lens.contact[0].name).to.equal('Test Author')
      expect(lens.contact[0].telecom).to.be.an('array').with.lengthOf(2)
    })

    it('should use defaults for missing fields', () => {
      const packageJson = {name: 'minimal-package'}

      const lens = LensFhirResource.fromPackageJson(packageJson, sampleBase64)

      expect(lens.version).to.equal('0.0.1')
      expect(lens.description).to.equal('No description provided')
      expect(lens.publisher).to.equal('Unknown')
    })

    it('should handle custom purpose and usage fields', () => {
      const packageJson = {
        name: 'custom-lens',
        purpose: 'Custom purpose',
        usage: 'Custom usage',
      }

      const lens = LensFhirResource.fromPackageJson(packageJson, sampleBase64)

      expect(lens.purpose).to.equal('Custom purpose')
      expect(lens.usage).to.equal('Custom usage')
    })
  })

  describe('FHIR compliance', () => {
    it('should include required FHIR Library resource fields', () => {
      const lens = LensFhirResource.defaultValues('test-lens', sampleBase64)

      // Required fields for FHIR Library resource
      expect(lens).to.have.property('resourceType')
      expect(lens).to.have.property('status')
      expect(lens).to.have.property('type')
      expect(lens).to.have.property('content')
    })

    it('should set type coding correctly', () => {
      const lens = LensFhirResource.defaultValues('test-lens', sampleBase64)

      expect(lens.type).to.have.property('coding')
      expect(lens.type.coding).to.be.an('array')
    })

    it('should include metadata fields', () => {
      const lens = LensFhirResource.defaultValues('test-lens', sampleBase64)

      expect(lens).to.have.property('url')
      expect(lens).to.have.property('identifier')
      expect(lens).to.have.property('version')
      expect(lens).to.have.property('title')
      expect(lens).to.have.property('description')
      expect(lens).to.have.property('publisher')
      expect(lens).to.have.property('contact')
      expect(lens).to.have.property('jurisdiction')
    })
  })
})
