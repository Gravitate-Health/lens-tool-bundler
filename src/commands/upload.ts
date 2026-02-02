import {Args, Command, Flags} from '@oclif/core'
import ora from 'ora'

import {getFileData} from '../controllers/file-controller.js'
import * as spinnerController from '../controllers/spinner-controller.js'
import {uploadLenses} from '../controllers/upload-controller.js'

const spinner = ora();

export default class Upload extends Command {
  static override args = {
    file: Args.string({description: 'file to read', required: true}),
  }
  static override description = 'upload file (json format) to a valid FHIR server.'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    // flag with a value (-n, --name=VALUE)
    domain: Flags.string({char: 'd', description: 'domain where FHIR server is hosted (with http/https)', required: true}),
  }

  public async run(): Promise<void> {
    spinner.start('Starting upload process...');
    const {args, flags} = await this.parse(Upload);

    try {
      spinnerController.changeSpinnerText('Retrieving file data...', spinner);
      const fileData = getFileData(args.file);
      spinnerController.stopAndPersistSpinner('File data retrieved', spinner);
      spinnerController.changeSpinnerText('Uploading lenses...', spinner);

      const response = await uploadLenses(fileData, flags.domain);

      if (response.ok) {
        spinner.stopAndPersist({
          symbol: '⭐',
          text: 'Process complete - Upload successful',
        });
      } else {
        const errorText = await response.text();
        spinner.fail(`Upload failed with status ${response.status}`);

        // Try to parse error details
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.issue) {
            this.log('Error details:');
            for (const issue of errorJson.issue) {
              this.log(`  - ${issue.severity}: ${issue.diagnostics || issue.details?.text || 'No details'}`);
            }
          } else {
            this.log(`Error: ${errorText}`);
          }
        } catch {
          this.log(`Error: ${errorText}`);
        }

        this.error('Upload failed', {exit: 1});
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error during upload: ${message}`);
      this.error(`Upload failed: ${message}`, {exit: 1});
    }
  }
}
