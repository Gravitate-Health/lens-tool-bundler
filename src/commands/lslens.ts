import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'
import path from 'node:path'

import type {LensEntry} from '../controllers/dir-controller.js';

import * as dirController from '../controllers/dir-controller.js'

export default class Lslens extends Command {
  static args = {
    directory: Args.string({
      default: '.',
      description: 'directory to search for lenses',
      required: false,
    }),
  }
  static description = 'List valid FHIR lenses in a directory (similar to ls).'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./lenses',
    '<%= config.bin %> <%= command.id %> -a',
    '<%= config.bin %> <%= command.id %> -v',
    '<%= config.bin %> <%= command.id %> --almost-valid',
    '<%= config.bin %> <%= command.id %> --show-reasons',
    '<%= config.bin %> <%= command.id %> ./lenses | xargs -I {} echo "Processing: {}"',
  ]
  static flags = {
    all: Flags.boolean({
      char: 'a',
      description: 'include lenses that may be missing content (base64 data)',
      required: false,
    }),
    'almost-valid': Flags.boolean({
      description: 'show almost-valid lenses (missing only content or minor fields)',
      required: false,
    }),
    json: Flags.boolean({
      char: 'j',
      description: 'output as JSON format',
      required: false,
    }),
    'show-reasons': Flags.boolean({
      char: 'r',
      description: 'show what is missing for full validation',
      required: false,
    }),
    validate: Flags.boolean({
      char: 'v',
      description: 'include full validation report for each lens',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Lslens);

    const directory = path.resolve(args.directory);

    try {
      // Discover all lenses (both valid and almost-valid)
      const lenses = await dirController.discoverLenses(directory);
      
      // Also discover invalid lenses if requested
      const allJsonFiles = dirController.findJsonFiles(directory);
      const allLenses: Array<LensEntry & { validation?: dirController.ValidationResult }> = [];
      
      // Validate all JSON files to categorize them
      for (const filePath of allJsonFiles) {
        const existingLens = lenses.find(l => l.path === filePath);
        if (existingLens) {
          const validation = dirController.validateFHIRLens(existingLens.lens);
          allLenses.push({ ...existingLens, validation });
        } else {
          // Try to parse as potential lens
          try {
            const content = require('fs').readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(content);
            const validation = dirController.validateFHIRLens(jsonData);
            
            if (jsonData.resourceType === 'Library') {
              allLenses.push({
                hasBase64: false,
                lens: jsonData,
                name: jsonData.name || 'unknown',
                path: filePath,
                status: jsonData.status || 'unknown',
                url: jsonData.url || '',
                validation,
                version: jsonData.version || 'unknown',
              });
            }
          } catch {
            // Skip files that can't be parsed
          }
        }
      }

      if (allLenses.length === 0) {
        if (!flags.json) {
          this.log('No lenses found.');
        }

        return;
      }

      // Filter lenses based on flags
      let filteredLenses = allLenses;

      if (flags['almost-valid']) {
        // Only show almost-valid lenses (1-2 errors, typically content-related)
        filteredLenses = allLenses.filter(lens => {
          const val = lens.validation;
          if (!val) return false;
          return !val.isValid && val.errors.length <= 2 && 
                 val.errors.some(e => e.includes('content'));
        });
      } else if (!flags.all) {
        // Only include fully valid lenses
        filteredLenses = allLenses.filter(lens => lens.validation?.isValid || lens.hasBase64);
      }

      if (flags.json) {
        // Output as JSON for programmatic use
        this.outputJson(filteredLenses, flags.validate || flags['show-reasons']);
      } else if (flags.validate || flags['show-reasons']) {
        // Output with full validation report
        this.outputWithValidation(filteredLenses, flags['show-reasons']);
      } else {
        // Simple output - just file paths (useful for xargs)
        this.outputSimple(filteredLenses);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(`Error listing lenses: ${message}`);
    }
  }

  private outputJson(lenses: Array<LensEntry & { validation?: dirController.ValidationResult }>, includeValidation: boolean): void {
    const output = lenses.map(lens => {
      const result: Record<string, unknown> = {
        hasBase64: lens.hasBase64,
        name: lens.name,
        path: lens.path,
        status: lens.status,
        url: lens.url,
        version: lens.version,
      };

      if (lens.enhancedWithJs) {
        result.enhancedWithJs = lens.enhancedWithJs;
        result.enhanceSource = lens.enhanceSource;
      }

      if (includeValidation) {
        const validation = lens.validation || dirController.validateFHIRLens(lens.lens);
        result.validation = {
          errors: validation.errors,
          isValid: validation.isValid,
          missingRequirements: this.getMissingRequirements(lens.lens, validation),
        };
      }

      return result;
    });

    this.log(JSON.stringify(output, null, 2));
  }

  private outputSimple(lenses: Array<LensEntry & { validation?: dirController.ValidationResult }>): void {
    // Output just the file paths, one per line (ideal for xargs)
    for (const lens of lenses) {
      this.log(lens.path);
    }
  }

  private outputWithValidation(lenses: Array<LensEntry & { validation?: dirController.ValidationResult }>, showReasons: boolean): void {
    for (const lens of lenses) {
      this.log(`\n${'='.repeat(60)}`);
      this.log(`File: ${lens.path}`);
      this.log(`Name: ${lens.name}`);
      this.log(`URL: ${lens.url}`);
      this.log(`Version: ${lens.version}`);
      this.log(`Status: ${lens.status}`);
      this.log(`Has Base64 Content: ${lens.hasBase64 ? 'Yes' : 'No'}`);

      if (lens.enhancedWithJs) {
        this.log(`Enhanced with JS: ${lens.enhancedWithJs}`);
        this.log(`Enhancement Source: ${lens.enhanceSource}`);
      }

      // Validate the lens
      const validation = lens.validation || dirController.validateFHIRLens(lens.lens);

      this.log('\nValidation:');
      this.log(`  Valid: ${validation.isValid ? 'Yes' : 'No'}`);

      if (validation.errors.length > 0) {
        this.log('  Errors:');
        for (const error of validation.errors) {
          this.log(`    - ${error}`);
        }
        
        if (showReasons) {
          const missing = this.getMissingRequirements(lens.lens, validation);
          if (missing.length > 0) {
            this.log('\n  Required for Full Validation:');
            for (const req of missing) {
              this.log(`    - ${req}`);
            }
          }
        }
      } else {
        this.log('  No validation errors');
      }
    }

    this.log(`\n${'='.repeat(60)}`);
    this.log(`Total lenses found: ${lenses.length}`);
  }

  private getMissingRequirements(lens: Record<string, unknown>, validation: dirController.ValidationResult): string[] {
    const requirements: string[] = [];

    // Check for required fields based on FHIR Lens profile
    // Reference: https://build.fhir.org/ig/hl7-eu/gravitate-health/StructureDefinition-lens.html

    if (!lens.name || typeof lens.name !== 'string') {
      requirements.push('name (string, required): Computer-friendly name for the lens');
    }

    if (!lens.version || typeof lens.version !== 'string') {
      requirements.push('version (string, required): Business version of the library (e.g., "1.0.0")');
    }

    if (!lens.status || typeof lens.status !== 'string') {
      requirements.push('status (code, required): draft | active | retired | unknown');
    }

    if (!lens.description || typeof lens.description !== 'string') {
      requirements.push('description (markdown, required): Natural language description of the lens');
    }

    if (!lens.purpose || typeof lens.purpose !== 'string') {
      requirements.push('purpose (markdown, required): Why this lens is defined');
    }

    if (!lens.usage || typeof lens.usage !== 'string') {
      requirements.push('usage (markdown, required): Describes the clinical usage of the lens');
    }

    if (!lens.copyright || typeof lens.copyright !== 'string') {
      requirements.push('copyright (markdown, required): Use and/or publishing restrictions');
    }

    // Check type field
    if (!lens.type || typeof lens.type !== 'object') {
      requirements.push('type (CodeableConcept, required): Must be "logical-library"');
    } else {
      const type = lens.type as Record<string, unknown>;
      const coding = type.coding as Array<Record<string, unknown>> | undefined;
      if (!coding || !Array.isArray(coding) || coding.length === 0) {
        requirements.push('type.coding (required): Must contain code "logical-library"');
      }
    }

    // Check identifier
    if (!lens.identifier || !Array.isArray(lens.identifier) || lens.identifier.length === 0) {
      requirements.push('identifier (required): At least one identifier with system "http://gravitate-health.lst.tfo.upm.es"');
    }

    // Check jurisdiction
    if (!lens.jurisdiction || !Array.isArray(lens.jurisdiction) || lens.jurisdiction.length === 0) {
      requirements.push('jurisdiction (required): At least one jurisdiction code');
    }

    // Check parameter
    if (!lens.parameter || !Array.isArray(lens.parameter) || lens.parameter.length === 0) {
      requirements.push('parameter (required): At least one parameter definition');
    }

    // Check content (base64 data)
    if (!lens.content || !Array.isArray(lens.content) || lens.content.length === 0) {
      requirements.push('content (required): At least one attachment with base64-encoded lens code');
    } else {
      const content = lens.content as Array<Record<string, unknown>>;
      let hasValidData = false;
      for (const item of content) {
        if (item.data && typeof item.data === 'string' && item.data.length > 0) {
          hasValidData = true;
          break;
        }
      }

      if (!hasValidData) {
        requirements.push('content[].data (base64Binary, required): Base64-encoded JavaScript lens function');
      }
    }

    // Check extension for LEE version
    if (!lens.extension || !Array.isArray(lens.extension)) {
      requirements.push('extension (required): LEE version extension (http://hl7.eu/fhir/ig/gravitate-health/StructureDefinition/lee-version)');
    } else {
      const extensions = lens.extension as Array<Record<string, unknown>>;
      const hasLeeVersion = extensions.some(ext => 
        ext.url === 'http://hl7.eu/fhir/ig/gravitate-health/StructureDefinition/lee-version'
      );
      if (!hasLeeVersion) {
        requirements.push('extension[lee-version] (required): LEE version string');
      }
    }

    return requirements;
  }
}
