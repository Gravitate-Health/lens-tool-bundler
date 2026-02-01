import { Args, Command, Flags } from '@oclif/core'
import inquirer from 'inquirer';
import ora from 'ora'
import * as fs from 'node:fs';
import * as path from 'node:path';

import { getFileData, writeBundleToFile } from '../controllers/file-controller.js';
import { changeSpinnerText, stopAndPersistSpinner } from '../controllers/spinner-controller.js'
import { LensFhirResource } from '../models/lens-fhir-resource.js'

const spinner = ora();

export default class Bundle extends Command {
  static args = {
    file: Args.string({ description: 'file to read', required: true }),
  }

  static description = 'Bundles raw lenses into a FHIR compliant single file.'

  static examples = [
    '<%= config.bin %> <%= command.id %> lens.js -n my-lens',
    '<%= config.bin %> <%= command.id %> lens.js -n my-lens -d',
    '<%= config.bin %> <%= command.id %> lens.js -p',
    '<%= config.bin %> <%= command.id %> lens.js -u',
  ]

  static flags = {
    // flag with no value (-f, --force)
    default: Flags.boolean  ({ char: 'd', description: 'use default values for the bundle', required: false}),
    name: Flags.string({ char: 'n', description: 'name to apply to lens', required: false }),
    update: Flags.boolean({ char: 'u', description: 'update existing bundle file (content and date only)', required: false }),
    'package-json': Flags.boolean({ char: 'p', description: 'use values from package.json to populate FHIR library', required: false }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Bundle);

    // Validate flag combinations
    if (flags['package-json']) {
      if (flags.default) {
        this.error('The --package-json flag is incompatible with --default (-d) flag');
      }
      if (flags.name) {
        this.error('The --package-json flag is incompatible with --name (-n) flag');
      }
    } else if (!flags.update && !flags.name && !flags['package-json']) {
      this.error('Either --name (-n) or --package-json (-p) flag is required when not updating');
    }

    spinner.start('Starting process...');

    if (flags.update) {
      this.updateExistingBundle(args.file, flags.name, flags['package-json']);
    } else if (flags['package-json']) {
      this.bundleLensesFromPackageJson(args.file);
    } else if (flags.default) {
      this.bundleLensesDefaultInformaton(args.file, flags.name!);
    } else {
      this.bundleLensesInteractive(args.file, flags.name!);
    }
  }

  private bundleLensesDefaultInformaton(file: string, name: string): void {
    changeSpinnerText('Bundling lenses with default information', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = this.stringTobase64(fileData);
    stopAndPersistSpinner('File data converted to base64', spinner);
    changeSpinnerText(`Making bundle with name: ${name}`, spinner);
    const bundle = LensFhirResource.defaultValues(name, base64FileData);
    stopAndPersistSpinner('Bundle created', spinner);
    changeSpinnerText('Writing bundle to file...', spinner)
    writeBundleToFile(bundle, base64FileData);
    stopAndPersistSpinner(`Bundle written to file: ${bundle.name}.json`, spinner);
    spinner.stopAndPersist({
      symbol: '⭐',
      text: 'Process complete',
    });
  }

  private bundleLensesInteractive(file: string, name: string): void {
    changeSpinnerText('Bundling lenses', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = this.stringTobase64(fileData);
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
      }
    ]).then((answers) => {
      changeSpinnerText(`Making bundle with name: ${answers.name}`, spinner);
      const bundle = LensFhirResource.interactiveValues(answers.name, answers.description, answers.purpose, answers.usage, base64FileData);
      stopAndPersistSpinner('Bundle created', spinner);
      changeSpinnerText('Writing bundle to file...', spinner)
      writeBundleToFile(bundle, base64FileData);
      stopAndPersistSpinner(`Bundle written to file: ${bundle.name}.json`, spinner);
      spinner.stopAndPersist({
        symbol: '⭐',
        text: 'Process complete',
      });
    });
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

  private bundleLensesFromPackageJson(file: string): void {
    changeSpinnerText('Reading package.json...', spinner);
    const packageJson = this.readPackageJson();
    
    if (!packageJson.name) {
      this.error('package.json does not contain a "name" field');
    }
    
    stopAndPersistSpinner('package.json read successfully', spinner);
    changeSpinnerText('Bundling lenses with package.json values', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = this.stringTobase64(fileData);
    stopAndPersistSpinner('File data converted to base64', spinner);
    changeSpinnerText(`Making bundle with name: ${packageJson.name}`, spinner);
    const bundle = LensFhirResource.fromPackageJson(packageJson, base64FileData);
    stopAndPersistSpinner('Bundle created', spinner);
    changeSpinnerText('Writing bundle to file...', spinner);
    writeBundleToFile(bundle, base64FileData);
    stopAndPersistSpinner(`Bundle written to file: ${bundle.name}.json`, spinner);
    spinner.stopAndPersist({
      symbol: '⭐',
      text: 'Process complete',
    });
  }

  private updateExistingBundle(file: string, name?: string, usePackageJson?: boolean): void {
    // Determine the name from flags or try to find existing bundle
    let bundleName: string | undefined;
    let bundleFileName: string | undefined;
    
    if (usePackageJson) {
      bundleName = this.getPackageJsonName();
      bundleFileName = `${bundleName}.json`;
    } else if (name) {
      bundleName = name;
      bundleFileName = `${bundleName}.json`;
    } else {
      // Try to find any existing bundle in current directory
      const files = fs.readdirSync(process.cwd());
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        spinner.fail('No bundle file found. Please specify a name with -n or use -p flag.');
        return;
      }
      
      // Try to find a valid FHIR Library bundle
      for (const jsonFile of jsonFiles) {
        try {
          const content = fs.readFileSync(path.join(process.cwd(), jsonFile), 'utf8');
          const parsed = JSON.parse(content);
          if (parsed.resourceType === 'Library' && parsed.name) {
            bundleFileName = jsonFile;
            bundleName = parsed.name;
            break;
          }
        } catch {
          // Skip invalid JSON files
        }
      }
      
      if (!bundleFileName || !bundleName) {
        spinner.fail('No valid FHIR Library bundle found. Please specify a name with -n or use -p flag.');
        return;
      }
    }
    
    if (!fs.existsSync(bundleFileName)) {
      spinner.fail(`Bundle file ${bundleFileName} does not exist. Use without -u flag to create a new bundle.`);
      return;
    }

    changeSpinnerText('Updating existing bundle', spinner);
    changeSpinnerText('Retrieving file data...', spinner);
    const fileData = getFileData(file);
    stopAndPersistSpinner('File data retrieved', spinner);
    changeSpinnerText('Converting file data to base64...', spinner);
    const base64FileData = this.stringTobase64(fileData);
    stopAndPersistSpinner('File data converted to base64', spinner);
    changeSpinnerText(`Updating bundle: ${bundleName}`, spinner);
    
    try {
      const existingBundleJson = fs.readFileSync(bundleFileName, 'utf8');
      const existingBundle = JSON.parse(existingBundleJson);
      
      // Update only the content and date
      existingBundle.date = new Date().toISOString();
      if (existingBundle.content && existingBundle.content.length > 0) {
        existingBundle.content[0].data = base64FileData;
      }
      
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

  private stringTobase64(str: string): string {
    try {
      return Buffer.from(str, 'binary').toString('base64');
    } catch (error) {
      console.log('Error converting string to base64:', error);
      throw error;
    }
  }
}
