import {Args, Command, Flags} from '@oclif/core'
import inquirer from 'inquirer';
import * as fs from 'node:fs';
import path from 'node:path'
import ora from 'ora'

import {getFileData, toBase64Utf8} from '../controllers/file-controller.js';
import {changeSpinnerText, stopAndPersistSpinner} from '../controllers/spinner-controller.js'
import {LensFhirResource} from '../models/lens-fhir-resource.js'

const spinner = ora();

export default class Bundle extends Command {
  static args = {
    file: Args.string({description: 'file to read', required: true}),
  }
  static description = 'Bundles raw lenses into a FHIR compliant single file.'
  static examples = [
    '<%= config.bin %> <%= command.id %> lens.js -n my-lens',
    '<%= config.bin %> <%= command.id %> lens.js -n my-lens -d',
    '<%= config.bin %> <%= command.id %> lens.js -p',
    '<%= config.bin %> <%= command.id %> lens.js -u',
    '<%= config.bin %> <%= command.id %> lens.js -u --bundle my-lens.json',
    '<%= config.bin %> <%= command.id %> lens.js -n my-lens --bundle target-lens.json',
    '<%= config.bin %> <%= command.id %> lens.js -n my-lens --source-encoding windows-1252',
  ]
  static flags = {
    // flag with no value (-f, --force)
    bundle: Flags.string({char: 'b', description: 'path to target Library json file (auto-detected if omitted)', required: false}),
    default: Flags.boolean({char: 'd', description: 'use default values for the bundle', required: false}),
    name: Flags.string({char: 'n', description: 'name to apply to lens', required: false}),
    'package-json': Flags.boolean({char: 'p', description: 'use values from package.json to populate FHIR library', required: false}),
    'source-encoding': Flags.string({description: 'source file encoding (auto-detected if omitted)', required: false}),
    update: Flags.boolean({char: 'u', description: 'update existing bundle file (content and date only)', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Bundle);

    // Validate flag combinations
    if (flags['package-json']) {
      if (flags.default) {
        this.error('The --package-json flag is incompatible with --default (-d) flag', {exit: 1});
      }

      if (flags.name) {
        this.error('The --package-json flag is incompatible with --name (-n) flag', {exit: 1});
      }
    } else if (!flags.update && !flags.name && !flags['package-json']) {
      this.error('Either --name (-n) or --package-json (-p) flag is required when not updating', {exit: 1});
    }

    spinner.start('Starting process...');

    try {
      if (flags.update) {
        await this.updateExistingBundle(args.file, flags.name, flags['package-json'], flags['source-encoding'], flags.bundle);
      } else if (flags['package-json']) {
        await this.bundleLensesFromPackageJson(args.file, flags['source-encoding'], flags.bundle);
      } else if (flags.default) {
        await this.bundleLensesDefaultInformaton(args.file, flags.name!, flags['source-encoding'], flags.bundle);
      } else {
        await this.bundleLensesInteractive(args.file, flags.name!, flags['source-encoding'], flags.bundle);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error during bundling: ${message}`);
      this.error(message, {exit: 1});
    }
  }

  private bundleLensesDefaultInformaton(file: string, name: string, sourceEncoding?: string, bundleFile?: string): void {
    changeSpinnerText('Bundling lenses with default information', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file, sourceEncoding);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = toBase64Utf8(fileData);
    stopAndPersistSpinner('File data converted to base64', spinner);
    changeSpinnerText(`Making bundle with name: ${name}`, spinner);
    const bundle = LensFhirResource.defaultValues(name, base64FileData);
    stopAndPersistSpinner('Bundle created', spinner);
    changeSpinnerText('Writing bundle to file...', spinner)
    const targetFile = bundleFile || this.findBundleFile(file, name);
    this.writeBundleToFileWithTarget(bundle, base64FileData, targetFile);
    const actualFileName = targetFile || `${bundle.name}.json`;
    stopAndPersistSpinner(`Bundle written to file: ${actualFileName}`, spinner);
    spinner.stopAndPersist({
      symbol: '⭐',
      text: 'Process complete',
    });
  }

  private bundleLensesFromPackageJson(file: string, sourceEncoding?: string, bundleFile?: string): void {
    changeSpinnerText('Reading package.json...', spinner);
    const packageJson = this.readPackageJson();

    if (!packageJson.name) {
      this.error('package.json does not contain a "name" field');
    }

    stopAndPersistSpinner('package.json read successfully', spinner);
    changeSpinnerText('Bundling lenses with package.json values', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file, sourceEncoding);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = toBase64Utf8(fileData);
    stopAndPersistSpinner('File data converted to base64', spinner);
    changeSpinnerText(`Making bundle with name: ${packageJson.name}`, spinner);
    const bundle = LensFhirResource.fromPackageJson(packageJson, base64FileData);
    stopAndPersistSpinner('Bundle created', spinner);
    changeSpinnerText('Writing bundle to file...', spinner);
    const targetFile = bundleFile || this.findBundleFile(file, packageJson.name);
    this.writeBundleToFileWithTarget(bundle, base64FileData, targetFile);
    const actualFileName = targetFile || `${bundle.name}.json`;
    stopAndPersistSpinner(`Bundle written to file: ${actualFileName}`, spinner);
    spinner.stopAndPersist({
      symbol: '⭐',
      text: 'Process complete',
    });
  }

  private bundleLensesInteractive(file: string, name: string, sourceEncoding?: string, bundleFile?: string): void {
    changeSpinnerText('Bundling lenses', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file, sourceEncoding);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = toBase64Utf8(fileData);
    stopAndPersistSpinner('File data converted to base64', spinner);

    inquirer.prompt([
      {
        default: name,
        message: 'Enter the name of the bundle:',
        name: 'name',
        type: 'input',
      },
      {
        message: 'Enter a description for the bundle:',
        name: 'description',
        type: 'input',
      },
      {
        message: 'Enter the usage of the bundle:',
        name: 'usage',
        type: 'input',
      },
      {
        message: 'Enter the purpose of the bundle:',
        name: 'purpose',
        type: 'input',
      },
    ]).then(answers => {
      changeSpinnerText(`Making bundle with name: ${answers.name}`, spinner);
      const bundle = LensFhirResource.interactiveValues(answers.name, answers.description, answers.purpose, answers.usage, base64FileData);
      stopAndPersistSpinner('Bundle created', spinner);
      changeSpinnerText('Writing bundle to file...', spinner)
      const targetFile = bundleFile || this.findBundleFile(file, answers.name);
      this.writeBundleToFileWithTarget(bundle, base64FileData, targetFile);
      const actualFileName = targetFile || `${bundle.name}.json`;
      stopAndPersistSpinner(`Bundle written to file: ${actualFileName}`, spinner);
      spinner.stopAndPersist({
        symbol: '⭐',
        text: 'Process complete',
      });
    });
  }

  /**
   * Find a bundle file with priority:
   * 1. Same name as JS file (e.g., lens.js -> lens.json)
   * 2. Same name as lens name (e.g., my-lens.json)
   */
  private findBundleFile(jsFile: string, lensName: string): string | undefined {
    const jsBaseName = path.basename(jsFile, path.extname(jsFile));
    const candidates = [
      `${jsBaseName}.json`,  // Priority 1: Same name as JS file
      `${lensName}.json`,    // Priority 2: Same name as lens name
    ];

    for (const candidate of candidates) {
      const candidatePath = path.resolve(candidate);
      if (fs.existsSync(candidatePath)) {
        try {
          const content = fs.readFileSync(candidatePath, 'utf8');
          const parsed = JSON.parse(content);
          if (parsed.resourceType === 'Library') {
            return candidate;
          }
        } catch {
          // Skip invalid JSON files
        }
      }
    }

    return undefined;
  }

  private getPackageJsonName(): string {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.error('package.json not found in current directory');
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (!packageJson.name) {
        this.error('package.json does not contain a "name" field');
      }

      return packageJson.name;
    } catch (error) {
      this.error(`Error reading package.json: ${error}`);
    }
  }

  private readPackageJson(): any {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.error('package.json not found in current directory');
    }

    try {
      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      this.error(`Error reading package.json: ${error}`);
    }
  }

  private updateExistingBundle(file: string, name?: string, usePackageJson?: boolean, sourceEncoding?: string, bundleFile?: string): void {
    // Determine the bundle file to update
    let bundleFileName: string | undefined;

    if (bundleFile) {
      // Explicit bundle file specified
      bundleFileName = bundleFile;
    } else if (usePackageJson) {
      const bundleName = this.getPackageJsonName();
      bundleFileName = this.findBundleFile(file, bundleName) || `${bundleName}.json`;
    } else if (name) {
      bundleFileName = this.findBundleFile(file, name) || `${name}.json`;
    } else {
      // Try to find bundle with same name as JS file first
      const jsBaseName = path.basename(file, path.extname(file));
      bundleFileName = this.findBundleFile(file, jsBaseName);

      if (!bundleFileName) {
        // Fallback: try to find any existing bundle in current directory
        const files = fs.readdirSync(process.cwd());
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        if (jsonFiles.length === 0) {
          spinner.fail('No bundle file found. Please specify --bundle, -n, or use -p flag.');
          return;
        }

        // Try to find a valid FHIR Library bundle
        for (const jsonFile of jsonFiles) {
          try {
            const content = fs.readFileSync(path.join(process.cwd(), jsonFile), 'utf8');
            const parsed = JSON.parse(content);
            if (parsed.resourceType === 'Library' && parsed.name) {
              bundleFileName = jsonFile;
              break;
            }
          } catch {
            // Skip invalid JSON files
          }
        }

        if (!bundleFileName) {
          spinner.fail('No valid FHIR Library bundle found. Please specify --bundle, -n, or use -p flag.');
          throw new Error('No valid FHIR Library bundle found');
        }
      }
    }

    if (!fs.existsSync(bundleFileName)) {
      spinner.fail(`Bundle file ${bundleFileName} does not exist. Use without -u flag to create a new bundle.`);
      throw new Error(`Bundle file ${bundleFileName} does not exist`);
    }

    changeSpinnerText('Updating existing bundle', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file, sourceEncoding);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = toBase64Utf8(fileData);
    stopAndPersistSpinner('File data converted to base64', spinner);
    changeSpinnerText(`Updating bundle: ${bundleFileName}`, spinner);

    try {
      const existingBundleJson = fs.readFileSync(bundleFileName, 'utf8');
      const existingBundle = JSON.parse(existingBundleJson);

      // Update only the content and date
      existingBundle.date = new Date().toISOString();

      // Ensure content is an array
      if (!Array.isArray(existingBundle.content)) {
        existingBundle.content = [];
      }

      if (existingBundle.content.length === 0) {
        existingBundle.content.push({});
      }

      existingBundle.content[0].data = base64FileData;

      const updatedBundleJson = JSON.stringify(existingBundle, null, 2);
      fs.writeFileSync(bundleFileName, updatedBundleJson);

      stopAndPersistSpinner('Bundle updated', spinner);
      spinner.stopAndPersist({
        symbol: '⭐',
        text: `Bundle ${bundleFileName} updated successfully (content and date)`,
      });
    } catch (error) {
      spinner.fail(`Error updating bundle: ${error}`);
      throw error;
    }
  }

  /**
   * Write bundle to specified file or use default naming
   */
  private writeBundleToFileWithTarget(bundle: LensFhirResource, base64Content: string, targetFile?: string): void {
    const bundleFileName = targetFile || `${bundle.name}.json`;

    // Check if file already exists
    if (fs.existsSync(bundleFileName)) {
      try {
        // Read existing bundle
        const existingBundleJson = fs.readFileSync(bundleFileName, 'utf8');
        const existingBundle = JSON.parse(existingBundleJson);

        // Update only the content and date
        existingBundle.date = new Date().toISOString();
        if (existingBundle.content && existingBundle.content.length > 0) {
          existingBundle.content[0].data = base64Content;
        }

        // Write updated bundle
        const updatedBundleJson = JSON.stringify(existingBundle, null, 2);
        fs.writeFileSync(bundleFileName, updatedBundleJson);
      } catch (error) {
        console.log('Error updating bundle file:', error);
        throw error;
      }
    } else {
      // Create new bundle file
      const bundleJson = JSON.stringify(bundle, null, 2);
      try {
        fs.writeFileSync(bundleFileName, bundleJson);
      } catch (error) {
        console.log('Error writing bundle to file:', error);
        throw error;
      }
    }
  }
}
