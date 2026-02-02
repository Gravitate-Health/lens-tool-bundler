import {ComprehensiveResult, LensLibrary, runComprehensiveLensTests} from '@gravitate-health/lens-tool-test'
import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'
import * as path from 'node:path'
import ora from 'ora'

import * as dirController from '../controllers/dir-controller.js'
import {changeSpinnerText, stopAndPersistSpinner} from '../controllers/spinner-controller.js'

const spinner = ora();

interface TestResult {
  errors: string[];
  failed: number;
  file: string;
  lensName: string;
  passed: number;
  skipped: number;
  status: 'error' | 'failed' | 'passed' | 'skipped';
}

interface BatchTestResult {
  details: TestResult[];
  failed: number;
  passed: number;
  skipped: number;
  total: number;
}

export default class BatchTest extends Command {
  static args = {
    directory: Args.string({
      default: '.',
      description: 'directory containing lenses to test',
      required: false,
    }),
  }
  static description = 'Batch test multiple lenses in a directory.'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./lenses',
    '<%= config.bin %> <%= command.id %> ./lenses --exclude "test.*"',
    '<%= config.bin %> <%= command.id %> ./lenses --verbose',
  ]
  static flags = {
    exclude: Flags.string({
      char: 'e',
      description: 'regex pattern to exclude files (applied to filename)',
      required: false,
    }),
    'fail-fast': Flags.boolean({
      char: 'f',
      description: 'stop on first test failure',
      required: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'show detailed test output for each lens',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BatchTest);

    const directory = path.resolve(args.directory);
    const excludePattern = flags.exclude ? new RegExp(flags.exclude) : null;
    const failFast = flags['fail-fast'] || false;
    const verbose = flags.verbose || false;

    spinner.start('Starting batch test process...');

    try {
      // Check if directory exists
      if (!fs.existsSync(directory)) {
        spinner.fail(`Directory does not exist: ${directory}`);
        this.error('Batch test failed: directory not found', {exit: 1});
      }

      changeSpinnerText('Discovering lenses...', spinner);
      const lenses = await dirController.discoverLenses(directory);

      stopAndPersistSpinner(`Found ${lenses.length} lens(es)`, spinner);

      if (lenses.length === 0) {
        spinner.info('No lenses found to test.');
        return;
      }

      const result: BatchTestResult = {
        details: [],
        failed: 0,
        passed: 0,
        skipped: 0,
        total: lenses.length,
      };

      // Build exclude regex if provided
      let excludeRegex: null | RegExp = null;
      if (excludePattern) {
        try {
          excludeRegex = new RegExp(excludePattern.source);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          spinner.fail(`Invalid exclude regex: ${message}`);
          this.error('Invalid regex pattern', {exit: 1});
        }
      }

      // Test each lens
      for (const lens of lenses) {
        const fileName = path.basename(lens.path);

        // Check if file should be excluded
        if (excludeRegex && excludeRegex.test(fileName)) {
          result.skipped++;
          result.details.push({
            errors: [],
            failed: 0,
            file: lens.path,
            lensName: lens.name,
            passed: 0,
            skipped: 1,
            status: 'skipped',
          });
          this.log(`⊘ Skipped: ${fileName} (matched exclude pattern)`);
          continue;
        }

        changeSpinnerText(`Testing: ${lens.name}...`, spinner);

        try {
          // eslint-disable-next-line no-await-in-loop
          const testResults: ComprehensiveResult[] = await runComprehensiveLensTests(lens.lens as LensLibrary);

          // Check if all tests passed
          const allPassed = testResults.every(r => r.success);
          const hasErrors = testResults.some(r => r.hasErrors);

          if (allPassed && !hasErrors) {
            result.passed++;
            result.details.push({
              errors: [],
              failed: 0,
              file: lens.path,
              lensName: lens.name,
              passed: 1,
              skipped: 0,
              status: 'passed',
            });
            this.log(`✓ Passed: ${fileName} (${testResults.length} test(s))`);

            if (verbose) {
              for (const testResult of testResults) {
                this.log(`    - EPI: ${testResult.epiId || 'N/A'}, Preservation: ${testResult.metrics.preservationPercentage.toFixed(2)}%`);
              }
            }
          } else {
            result.failed++;
            const failedTests = testResults.filter(r => !r.success || r.hasErrors);
            const allErrors: string[] = [];

            for (const testResult of failedTests) {
              if (testResult.errors && testResult.errors.length > 0) {
                allErrors.push(...testResult.errors);
              }

              if (testResult.metrics.preservationPercentage < 100) {
                allErrors.push(`Content preservation: ${testResult.metrics.preservationPercentage.toFixed(2)}%`);
              }
            }

            result.details.push({
              errors: allErrors,
              failed: 1,
              file: lens.path,
              lensName: lens.name,
              passed: 0,
              skipped: 0,
              status: 'failed',
            });
            this.log(`✗ Failed: ${fileName} (${failedTests.length}/${testResults.length} test(s) failed)`);
            for (const error of allErrors) {
              this.log(`    - ${error}`);
            }

            if (verbose) {
              this.log(`  Full details: ${JSON.stringify(failedTests, null, 2)}`);
            }

            if (failFast) {
              spinner.fail('Stopping due to test failure (fail-fast mode)');
              this.displaySummary(result);
              this.error('Batch test failed', {exit: 1});
            }
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          result.failed++;
          result.details.push({
            errors: [message],
            failed: 1,
            file: lens.path,
            lensName: lens.name,
            passed: 0,
            skipped: 0,
            status: 'error',
          });
          this.log(`✗ Error: ${fileName} - ${message}`);

          if (failFast) {
            spinner.fail('Stopping due to test error (fail-fast mode)');
            this.displaySummary(result);
            this.error('Batch test failed', {exit: 1});
          }
        }
      }

      spinner.stop();
      this.displaySummary(result);

      if (result.failed > 0) {
        spinner.stopAndPersist({
          symbol: '✗',
          text: 'Batch test complete - FAILURES DETECTED',
        });
        this.error('Some tests failed', {exit: 1});
      } else {
        spinner.stopAndPersist({
          symbol: '⭐',
          text: 'Batch test complete - ALL PASSED',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error during batch test: ${message}`);
      this.error(`Batch test failed: ${message}`, {exit: 1});
    }
  }

  private displaySummary(result: BatchTestResult): void {
    this.log('\n' + '='.repeat(60));
    this.log('Batch Test Summary:');
    this.log(`  Total lenses: ${result.total}`);
    this.log(`  Passed: ${result.passed}`);
    this.log(`  Failed: ${result.failed}`);
    this.log(`  Skipped: ${result.skipped}`);
    this.log('='.repeat(60));
  }
}
