import { Args, Command, Flags } from '@oclif/core'
import * as fs from 'node:fs'
import ora from 'ora'
import { ComprehensiveResult, runComprehensiveLensTests } from '@gravitate-health/lens-tool-test'

import { changeSpinnerText, stopAndPersistSpinner } from '../controllers/spinner-controller.js'

const spinner = ora();

export default class Test extends Command {
  static args = {
    file: Args.string({ description: 'lens file to test (JSON format)', required: true }),
  }

  static description = 'Run comprehensive tests on a FHIR lens.'

  static examples = [
    '<%= config.bin %> <%= command.id %> my-lens.json',
    '<%= config.bin %> <%= command.id %> ./lenses/enhance-lens.json',
  ]

  static flags = {
    verbose: Flags.boolean({ char: 'v', description: 'show detailed test output', required: false }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Test);

    spinner.start('Starting lens test...');

    try {
      // Check if file exists
      if (!fs.existsSync(args.file)) {
        spinner.fail(`File does not exist: ${args.file}`);
        this.error('Test failed: file not found', { exit: 1 });
      }

      changeSpinnerText('Reading lens file...', spinner);
      const lensContent = fs.readFileSync(args.file, 'utf8');
      const lensData = JSON.parse(lensContent);
      
      stopAndPersistSpinner('Lens file loaded', spinner);
      changeSpinnerText('Running comprehensive tests...', spinner);

      // Run the tests
      const testResults: ComprehensiveResult[] = await runComprehensiveLensTests(lensData);

      spinner.stop();

      // Display results
      this.log('\n' + '='.repeat(60));
      this.log(`Test Results for: ${lensData.name || args.file}`);
      this.log('='.repeat(60));

      // Check if all tests passed
      const allPassed = testResults.every(result => result.success);
      const hasErrors = testResults.some(result => result.hasErrors);

      if (allPassed && !hasErrors) {
        this.log('✓ All tests passed!');
        this.log(`\nRan ${testResults.length} test(s)`);
        
        if (flags.verbose) {
          this.log('\nTest Details:');
          for (const result of testResults) {
            this.log(`  - EPI: ${result.epiId || 'N/A'}, IPS: ${result.ipsId || 'N/A'}`);
            this.log(`    Lenses: ${result.lensNames.join(', ')}`);
            this.log(`    Preservation: ${result.metrics.preservationPercentage.toFixed(2)}%`);
          }
        }
        
        spinner.stopAndPersist({
          symbol: '⭐',
          text: 'Test complete - PASSED',
        });
        
        this.exit(0);
      } else {
        this.log('✗ Tests failed!');
        this.log(`\nRan ${testResults.length} test(s)`);
        
        const failedTests = testResults.filter(result => !result.success || result.hasErrors);
        this.log(`Failed: ${failedTests.length}`);
        
        this.log('\nErrors:');
        for (const result of failedTests) {
          this.log(`  Test: EPI ${result.epiId || 'N/A'}, IPS ${result.ipsId || 'N/A'}`);
          if (result.errors && result.errors.length > 0) {
            for (const error of result.errors) {
              this.log(`    - ${error}`);
            }
          }

          if (result.metrics.preservationPercentage < 100) {
            this.log(`    - Content preservation: ${result.metrics.preservationPercentage.toFixed(2)}% (${result.metrics.missingWords} words missing)`);
          }
        }

        if (flags.verbose) {
          this.log('\nFull Test Details:');
          this.log(JSON.stringify(testResults, null, 2));
        }

        spinner.fail('Test complete - FAILED');
        this.error('Test failed', { exit: 1 });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error during test: ${message}`);
      this.error(`Test failed: ${message}`, { exit: 1 });
    }
  }
}
