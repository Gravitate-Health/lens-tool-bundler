import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'
import path from 'node:path'
import ora from 'ora'

import * as dirController from '../controllers/dir-controller.js'
import {getFileData, toBase64Utf8} from '../controllers/file-controller.js'
import {changeSpinnerText, stopAndPersistSpinner} from '../controllers/spinner-controller.js'

const spinner = ora();

interface BatchResult {
  details: Array<{
    action: 'error' | 'skipped' | 'updated';
    file: string;
    reason: string;
  }>;
  errors: number;
  processed: number;
  skipped: number;
  updated: number;
}

export default class BatchBundle extends Command {
  static args = {
    directory: Args.string({
      default: '.',
      description: 'directory containing lenses to bundle',
      required: false,
    }),
  }
  static description = 'Batch process and bundle multiple lenses in a directory.'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./lenses',
    '<%= config.bin %> <%= command.id %> ./lenses --skip-valid',
    '<%= config.bin %> <%= command.id %> ./lenses --skip-date',
    String.raw`<%= config.bin %> <%= command.id %> ./lenses --exclude "test.*" --exclude ".*\.draft\.json$"`,
    '<%= config.bin %> <%= command.id %> ./lenses --exclude "node_modules"',
  ]
  static flags = {
    exclude: Flags.string({
      char: 'e',
      description: 'regex pattern to exclude files/directories (can be used multiple times)',
      multiple: true,
      required: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'force bundle all lenses even if content is up to date',
      required: false,
    }),
    'skip-date': Flags.boolean({
      char: 'd',
      description: 'do not update the date field when bundling',
      required: false,
    }),
    'skip-valid': Flags.boolean({
      char: 's',
      description: 'skip lenses that already have valid base64 content',
      required: false,
    }),
    'source-encoding': Flags.string({description: 'source file encoding (auto-detected if omitted)', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BatchBundle);

    const directory = path.resolve(args.directory);
    const skipValid = flags['skip-valid'] || false;
    const skipDate = flags['skip-date'] || false;
    const excludePatterns = flags.exclude || [];
    const force = flags.force || false;
    const sourceEncoding = flags['source-encoding'];

    spinner.start('Starting batch bundle process...');

    try {
      // Check if directory exists
      if (!fs.existsSync(directory)) {
        spinner.fail(`Directory does not exist: ${directory}`);
        return;
      }

      changeSpinnerText('Discovering lenses...', spinner);

      // Build exclusion list: start with defaults, add user-provided patterns
      const exclusions = [...dirController.DEFAULT_EXCLUSIONS];
      for (const pattern of excludePatterns) {
        try {
          exclusions.push(new RegExp(pattern));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          spinner.fail(`Invalid exclude regex "${pattern}": ${message}`);
          this.error(`Invalid exclude regex: ${message}`, {exit: 1});
        }
      }

      const lenses = await dirController.discoverLenses(directory, exclusions);
      const enhanceFiles = dirController.findEnhanceFiles(directory, exclusions);

      stopAndPersistSpinner(`Found ${lenses.length} lens(es)`, spinner);

      if (lenses.length === 0) {
        spinner.info('No lenses found to process.');
        return;
      }

      const result: BatchResult = {
        details: [],
        errors: 0,
        processed: 0,
        skipped: 0,
        updated: 0,
      };

      // Process each lens
      for (const lens of lenses) {
        const fileName = path.basename(lens.path);

        // Check if lens already has valid content and skip-valid flag is set (unless force is true)
        if (!force && skipValid && lens.hasBase64 // Check if it was enhanced or already had content
          && !lens.enhancedWithJs) {
          result.skipped++;
          result.details.push({
            action: 'skipped',
            file: lens.path,
            reason: 'Already has valid base64 content',
          });
          continue;
        }

        try {
          // Determine which JS file to use with priority:
          // 1. Exact match: JS file with same name as JSON file (e.g., lens.js for lens.json)
          // 2. Fallback: Any JS file with enhance function in the same directory
          let jsFile = enhanceFiles.exact[lens.path];
          let enhanceSource = 'exact-match';

          if (!jsFile) {
            const fileDir = path.dirname(lens.path);
            const fallbackFiles = enhanceFiles.fallback[fileDir];
            if (fallbackFiles && fallbackFiles.length > 0) {
              jsFile = fallbackFiles[0];
              enhanceSource = 'fallback';
            }
          }

          if (!jsFile) {
            result.skipped++;
            result.details.push({
              action: 'skipped',
              file: lens.path,
              reason: 'No corresponding JS file found',
            });
            continue;
          }

          // Read the JS file and convert to base64
          const jsContent = getFileData(jsFile, sourceEncoding);
          const base64Content = toBase64Utf8(jsContent);

          // Check if content needs update
          const content = lens.lens.content as Array<Record<string, unknown>> | undefined;
          const currentContent = content?.[0]?.data;
          const needsUpdate = currentContent !== base64Content;

          if (!needsUpdate && flags['skip-valid']) {
            result.skipped++;
            result.details.push({
              action: 'skipped',
              file: lens.path,
              reason: 'Content already up to date',
            });
            continue;
          }

          // Update the lens
          const lensContent = (lens.lens.content || []) as Array<Record<string, unknown>>;
          if (lensContent.length === 0) {
            lensContent.push({});
          }

          lensContent[0].contentType = 'application/javascript';
          lensContent[0].data = base64Content;
          lens.lens.content = lensContent;

          // Update date unless skip-date flag is set
          if (!skipDate) {
            lens.lens.date = new Date().toISOString();
          }

          // Write the updated lens back to file
          const lensJson = JSON.stringify(lens.lens, null, 2);
          fs.writeFileSync(lens.path, lensJson);

          result.updated++;
          result.processed++;
          result.details.push({
            action: 'updated',
            file: lens.path,
            reason: `Bundled with ${enhanceSource} JS: ${jsFile}`,
          });

          this.log(`✓ Updated: ${fileName}`);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          result.errors++;
          result.processed++;
          result.details.push({
            action: 'error',
            file: lens.path,
            reason: message,
          });
          this.log(`✗ Error: ${fileName} - ${message}`);
        }
      }

      // Display summary
      spinner.stopAndPersist({
        symbol: '⭐',
        text: 'Batch bundle complete',
      });

      this.log('\n' + '='.repeat(60));
      this.log('Summary:');
      this.log(`  Total lenses found: ${lenses.length}`);
      this.log(`  Updated: ${result.updated}`);
      this.log(`  Skipped: ${result.skipped}`);
      this.log(`  Errors: ${result.errors}`);
      this.log('='.repeat(60));

      // Exit with error code if any errors occurred
      if (result.errors > 0) {
        this.error('Some lenses failed to bundle', {exit: 1});
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error during batch bundle: ${message}`);
      this.error(message, {exit: 1});
    }
  }
}
