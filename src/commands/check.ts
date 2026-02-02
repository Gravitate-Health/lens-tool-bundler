import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'node:fs';
import * as path from 'node:path';

import {getFileData} from '../controllers/file-controller.js';

export default class Check extends Command {
  static args = {
    file: Args.string({description: 'JavaScript file to check', required: true}),
  }
  static description = 'Check integrity between JavaScript file and FHIR Library bundle content.'
  static examples = [
    '<%= config.bin %> <%= command.id %> mylens.js',
    '<%= config.bin %> <%= command.id %> mylens.js -n MyLens',
    '<%= config.bin %> <%= command.id %> mylens.js -b MyLens.json',
  ]
  static flags = {
    bundle: Flags.string({char: 'b', description: 'path to the bundle file to check', required: false}),
    name: Flags.string({char: 'n', description: 'name of the bundle to check (without .json extension)', required: false}),
    quiet: Flags.boolean({char: 'q', description: 'suppress output, only return exit code', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Check);

    try {
      const result = await this.checkIntegrity(args.file, flags.name, flags.bundle, flags.quiet);

      if (!result.success) {
        this.exit(1);
      }
    } catch (error) {
      // Rethrow EEXIT errors (from this.exit() calls) - don't catch them
      if (error instanceof Error && error.message.includes('EEXIT')) {
        throw error;
      }

      if (!flags.quiet) {
        this.error(`Error during integrity check: ${error}`);
      }

      this.exit(2);
    }
  }

  private async checkIntegrity(
    jsFile: string,
    bundleName?: string,
    bundlePath?: string,
    quiet?: boolean,
  ): Promise<{message: string; success: boolean;}> {
    // Read JavaScript file
    if (!fs.existsSync(jsFile)) {
      const message = `JavaScript file not found: ${jsFile}`;
      if (!quiet) this.error(message);
      return {message, success: false};
    }

    const jsContent = getFileData(jsFile);
    const expectedBase64 = Buffer.from(jsContent, 'binary').toString('base64');

    // Find bundle file
    let bundleFile: string;

    if (bundlePath) {
      bundleFile = bundlePath;
    } else if (bundleName) {
      bundleFile = `${bundleName}.json`;
    } else {
      // Auto-detect: try same name as JS file
      const jsBaseName = path.basename(jsFile, path.extname(jsFile));
      bundleFile = path.join(path.dirname(jsFile), `${jsBaseName}.json`);

      // If not found, try to find any Library bundle in the same directory
      if (!fs.existsSync(bundleFile)) {
        const dir = path.dirname(jsFile) || '.';
        const files = fs.readdirSync(dir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        let foundBundle = false;
        for (const jsonFile of jsonFiles) {
          const fullPath = path.join(dir, jsonFile);
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const parsed = JSON.parse(content);
            if (parsed.resourceType === 'Library') {
              bundleFile = fullPath;
              foundBundle = true;
              break;
            }
          } catch {
            // Skip invalid JSON files
          }
        }

        if (!foundBundle) {
          const message = `No FHIR Library bundle found for ${jsFile}`;
          if (!quiet) {
            this.log(`❌ ${message}`);
            this.log(`Searched for: ${path.basename(bundleFile)}`);
          }

          throw new Error(message);
        }
      }
    }

    // Read bundle file
    if (!fs.existsSync(bundleFile)) {
      const message = `Bundle file not found: ${bundleFile}`;
      if (!quiet) {
        this.log(`❌ ${message}`);
      }

      throw new Error(message);
    }

    let bundle: any;
    try {
      const bundleContent = fs.readFileSync(bundleFile, 'utf8');
      bundle = JSON.parse(bundleContent);
    } catch (error) {
      const message = `Failed to parse bundle file: ${bundleFile}`;
      if (!quiet) {
        this.log(`❌ ${message}`);
        this.log(`Error: ${error}`);
      }

      return {message, success: false};
    }

    // Validate bundle structure
    if (bundle.resourceType !== 'Library') {
      const message = `Bundle is not a FHIR Library resource: ${bundleFile}`;
      if (!quiet) {
        this.log(`❌ ${message}`);
      }

      return {message, success: false};
    }

    if (!bundle.content || bundle.content.length === 0) {
      const message = `Bundle has no content: ${bundleFile}`;
      if (!quiet) {
        this.log(`❌ ${message}`);
      }

      return {message, success: false};
    }

    const bundleBase64 = bundle.content[0].data;

    if (!bundleBase64) {
      const message = `Bundle content has no data: ${bundleFile}`;
      if (!quiet) {
        this.log(`❌ ${message}`);
      }

      return {message, success: false};
    }

    // Compare content
    if (bundleBase64 === expectedBase64) {
      const message = `✅ Integrity check passed: ${jsFile} ↔ ${bundleFile}`;
      if (!quiet) {
        this.log(message);
        this.log(`   JS file: ${jsFile}`);
        this.log(`   Bundle: ${bundleFile}`);
        this.log(`   Bundle name: ${bundle.name}`);
        this.log(`   Bundle version: ${bundle.version}`);
      }

      return {message, success: true};
    }

    const message = 'Integrity check failed: Content mismatch';
    if (!quiet) {
      this.log(`❌ ${message}`);
      this.log(`   JS file: ${jsFile}`);
      this.log(`   Bundle: ${bundleFile}`);
      this.log(`   Bundle name: ${bundle.name}`);
      this.log('   The content in the bundle does not match the JavaScript file.');
      this.log('   Run \'bundle -u\' to update the bundle with current JS content.');
    }

    return {message, success: false};
  }
}
