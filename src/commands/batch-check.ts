import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as dirController from '../controllers/dir-controller.js'

interface CheckResult {
  bundleFile: string;
  error?: string;
  jsFile: string;
  passed: boolean;
}

export default class BatchCheck extends Command {
  static args = {
    directory: Args.string({
      default: '.',
      description: 'directory to search for lens files',
      required: false,
    }),
  }
  static description = 'Batch check integrity between all lens JavaScript files and their FHIR Library bundles.'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./lenses',
    '<%= config.bin %> <%= command.id %> -q',
    '<%= config.bin %> <%= command.id %> --json',
  ]
  static flags = {
    json: Flags.boolean({
      char: 'j',
      description: 'output results as JSON',
      required: false,
    }),
    quiet: Flags.boolean({
      char: 'q',
      description: 'suppress output, only return exit code',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BatchCheck);

    const directory = path.resolve(args.directory);

    try {
      const enhanceFiles = dirController.findEnhanceFiles(directory);

      // Collect all JS files with their corresponding JSON files
      const filePairs: Array<{jsFile: string; jsonFile: string}> = [];

      // Get all JS files from exact matches
      for (const [jsonPath, jsPath] of Object.entries(enhanceFiles.exact)) {
        filePairs.push({
          jsFile: jsPath as string,
          jsonFile: jsonPath as string,
        });
      }

      if (filePairs.length === 0) {
        if (!flags.quiet && !flags.json) {
          this.log('No lens files found to check.');
        }

        return;
      }

      // Check each pair
      const results: CheckResult[] = [];
      let hasFailures = false;

      for (const pair of filePairs) {
        const result = await this.checkPair(pair.jsFile, pair.jsonFile);
        results.push(result);
        if (!result.passed) {
          hasFailures = true;
        }
      }

      // Output results
      if (flags.json) {
        this.outputJson(results);
      } else if (!flags.quiet) {
        this.outputResults(results);
      }

      // Exit with appropriate code
      if (hasFailures) {
        this.exit(1);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (!flags.quiet) {
        this.error(`Error during batch check: ${message}`);
      }

      this.exit(2);
    }
  }

  private async checkPair(jsFile: string, jsonFile: string): Promise<CheckResult> {
    try {
      // Read JavaScript file
      if (!fs.existsSync(jsFile)) {
        return {
          bundleFile: jsonFile,
          error: 'JavaScript file not found',
          jsFile,
          passed: false,
        };
      }

      const jsContent = fs.readFileSync(jsFile, 'utf8');
      const expectedBase64 = Buffer.from(jsContent, 'binary').toString('base64');

      // Check if bundle exists
      if (!fs.existsSync(jsonFile)) {
        return {
          bundleFile: jsonFile,
          error: 'Bundle file not found',
          jsFile,
          passed: false,
        };
      }

      // Read bundle file
      let bundle: any;
      try {
        const bundleContent = fs.readFileSync(jsonFile, 'utf8');
        bundle = JSON.parse(bundleContent);
      } catch {
        return {
          bundleFile: jsonFile,
          error: 'Failed to parse bundle JSON',
          jsFile,
          passed: false,
        };
      }

      // Validate bundle structure
      if (bundle.resourceType !== 'Library') {
        return {
          bundleFile: jsonFile,
          error: 'Bundle is not a FHIR Library resource',
          jsFile,
          passed: false,
        };
      }

      if (!bundle.content || bundle.content.length === 0 || !bundle.content[0].data) {
        return {
          bundleFile: jsonFile,
          error: 'Bundle has no content data',
          jsFile,
          passed: false,
        };
      }

      const bundleBase64 = bundle.content[0].data;

      // Compare content
      if (bundleBase64 === expectedBase64) {
        return {
          bundleFile: jsonFile,
          jsFile,
          passed: true,
        };
      }

      return {
        bundleFile: jsonFile,
        error: 'Content mismatch - bundle is out of sync with JS file',
        jsFile,
        passed: false,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        bundleFile: jsonFile,
        error: `Unexpected error: ${message}`,
        jsFile,
        passed: false,
      };
    }
  }

  private outputJson(results: CheckResult[]): void {
    const output = {
      failed: results.filter(r => !r.passed).length,
      passed: results.filter(r => r.passed).length,
      results: results.map(r => ({
        bundleFile: path.relative(process.cwd(), r.bundleFile),
        error: r.error || null,
        jsFile: path.relative(process.cwd(), r.jsFile),
        passed: r.passed,
      })),
      total: results.length,
    };

    this.log(JSON.stringify(output, null, 2));
  }

  private outputResults(results: CheckResult[]): void {
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);

    this.log(`\n${'='.repeat(70)}`);
    this.log('Batch Integrity Check Results');
    this.log(`${'='.repeat(70)}\n`);

    if (passed.length > 0) {
      this.log(`✅ PASSED (${passed.length}):`);
      for (const result of passed) {
        this.log(`   ${path.relative(process.cwd(), result.jsFile)} ↔ ${path.relative(process.cwd(), result.bundleFile)}`);
      }

      this.log('');
    }

    if (failed.length > 0) {
      this.log(`❌ FAILED (${failed.length}):`);
      for (const result of failed) {
        this.log(`   ${path.relative(process.cwd(), result.jsFile)} ↔ ${path.relative(process.cwd(), result.bundleFile)}`);
        if (result.error) {
          this.log(`      Error: ${result.error}`);
        }
      }

      this.log('');
    }

    this.log(`${'='.repeat(70)}`);
    this.log(`Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
    this.log(`${'='.repeat(70)}\n`);

    if (failed.length > 0) {
      this.log('💡 Tip: Run "lens-tool-bundler bundle <file> -u" to update out-of-sync bundles.');
    }
  }
}
