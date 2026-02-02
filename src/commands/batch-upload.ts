import {Args, Command, Flags} from '@oclif/core'
import * as fs from 'node:fs'
import * as path from 'node:path'
import ora from 'ora'

import * as dirController from '../controllers/dir-controller.js'
import {changeSpinnerText, stopAndPersistSpinner} from '../controllers/spinner-controller.js'
import {uploadLenses} from '../controllers/upload-controller.js'

const spinner = ora();

interface BatchUploadResult {
  details: Array<{
    action: 'error' | 'skipped' | 'uploaded';
    file: string;
    reason: string;
  }>;
  errors: number;
  processed: number;
  skipped: number;
  uploaded: number;
}

export default class BatchUpload extends Command {
  static args = {
    directory: Args.string({
      default: '.',
      description: 'directory containing lenses to upload',
      required: false,
    }),
  }
  static description = 'Batch process and upload multiple lenses to a FHIR server.'
  static examples = [
    '<%= config.bin %> <%= command.id %> -d https://fosps.gravitatehealth.eu/epi/api/fhir',
    '<%= config.bin %> <%= command.id %> ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir',
    '<%= config.bin %> <%= command.id %> ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --skip-valid',
    '<%= config.bin %> <%= command.id %> ./lenses -d https://fosps.gravitatehealth.eu/epi/api/fhir --exclude "test.*"',
  ]
  static flags = {
    domain: Flags.string({
      char: 'd',
      description: 'domain where FHIR server is hosted (with http/https)',
      required: true,
    }),
    exclude: Flags.string({
      char: 'e',
      description: 'regex pattern to exclude files (applied to filename)',
      required: false,
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'force bundle all lenses even if content is up to date',
      required: false,
    }),
    'skip-date': Flags.boolean({
      char: 't',
      description: 'do not update the date field when bundling',
      required: false,
    }),
    'skip-valid': Flags.boolean({
      char: 's',
      description: 'skip lenses that already have valid base64 content',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BatchUpload);

    const directory = path.resolve(args.directory);
    const skipValid = flags['skip-valid'] || false;
    const skipDate = flags['skip-date'] || false;
    const excludePattern = flags.exclude ? new RegExp(flags.exclude) : null;
    const force = flags.force || false;
    const {domain} = flags;

    spinner.start('Starting batch upload process...');

    try {
      // Check if directory exists
      if (!fs.existsSync(directory)) {
        spinner.fail(`Directory does not exist: ${directory}`);
        return;
      }

      changeSpinnerText('Discovering lenses...', spinner);
      const lenses = await dirController.discoverLenses(directory);
      const enhanceFiles = dirController.findEnhanceFiles(directory);

      stopAndPersistSpinner(`Found ${lenses.length} lens(es)`, spinner);

      if (lenses.length === 0) {
        spinner.info('No lenses found to process.');
        return;
      }

      const result: BatchUploadResult = {
        details: [],
        errors: 0,
        processed: 0,
        skipped: 0,
        uploaded: 0,
      };

      // Build exclude regex if provided
      let excludeRegex: null | RegExp = null;
      if (excludePattern) {
        try {
          excludeRegex = new RegExp(excludePattern.source);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          spinner.fail(`Invalid exclude regex: ${message}`);
          return;
        }
      }

      // Process each lens
      for (const lens of lenses) {
        const fileName = path.basename(lens.path);

        // Check if file should be excluded
        if (excludeRegex && excludeRegex.test(fileName)) {
          result.skipped++;
          result.details.push({
            action: 'skipped',
            file: lens.path,
            reason: 'Matched exclude pattern',
          });
          continue;
        }

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
          // Determine which JS file to use
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
          const jsContent = fs.readFileSync(jsFile, 'utf8');
          const base64Content = Buffer.from(jsContent, 'binary').toString('base64');

          // Check if content needs update
          const content = lens.lens.content as Array<Record<string, unknown>> | undefined;
          const currentContent = content?.[0]?.data;
          const needsUpdate = currentContent !== base64Content;

          if (!needsUpdate && skipValid && !force) {
            result.skipped++;
            result.details.push({
              action: 'skipped',
              file: lens.path,
              reason: 'Content already up to date',
            });
            continue;
          }

          // Update the lens in memory (don't write to file)
          const lensContent = (lens.lens.content || []) as Array<Record<string, unknown>>;
          if (lensContent.length === 0) {
            lensContent.push({});
          }

          lensContent[0].contentType = 'application/javascript';
          lensContent[0].data = base64Content;
          lens.lens.content = lensContent;          // Update date unless skip-date flag is set
          if (!skipDate) {
            lens.lens.date = new Date().toISOString();
          }

          // Upload the lens
          changeSpinnerText(`Uploading ${fileName}...`, spinner);
          const lensJson = JSON.stringify(lens.lens, null, 2);
          // eslint-disable-next-line no-await-in-loop
          const response = await uploadLenses(lensJson, domain);

          if (response.ok) {
            result.uploaded++;
            result.processed++;
            result.details.push({
              action: 'uploaded',
              file: lens.path,
              reason: `Uploaded with ${enhanceSource} JS: ${jsFile}`,
            });
            this.log(`✓ Uploaded: ${fileName}`);
          } else {
            // eslint-disable-next-line no-await-in-loop
            const errorText = await response.text();
            result.errors++;
            result.processed++;

            // Parse error details if available
            let errorDetails = errorText;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.issue) {
                errorDetails = errorJson.issue.map((i: any) => i.diagnostics || i.details?.text).join('; ');
              }
            } catch {
              // Keep original text if not JSON
            }

            result.details.push({
              action: 'error',
              file: lens.path,
              reason: `HTTP ${response.status}: ${errorDetails}`,
            });
            this.log(`✗ Error uploading ${fileName}: HTTP ${response.status}`);
            this.log(`   Details: ${errorDetails.slice(0, 200)}${errorDetails.length > 200 ? '...' : ''}`);
          }
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
        text: 'Batch upload complete',
      });

      this.log('\n' + '='.repeat(60));
      this.log('Summary:');
      this.log(`  Total lenses found: ${lenses.length}`);
      this.log(`  Uploaded: ${result.uploaded}`);
      this.log(`  Skipped: ${result.skipped}`);
      this.log(`  Errors: ${result.errors}`);
      this.log('='.repeat(60));

      // Exit with error code if any errors occurred
      if (result.errors > 0) {
        this.error('Some lenses failed to upload', {exit: 1});
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error during batch upload: ${message}`);
      this.error(message, {exit: 1});
    }
  }
}
