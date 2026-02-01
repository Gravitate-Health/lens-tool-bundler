import { Args, Command, Flags } from '@oclif/core'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import inquirer from 'inquirer';
import * as fs from 'node:fs'
import * as path from 'node:path'
import ora from 'ora'

import { changeSpinnerText, stopAndPersistSpinner } from '../controllers/spinner-controller.js'
import { LensFhirResource } from '../models/lens-fhir-resource.js'

const spinner = ora();
const execAsync = promisify(exec);
const LENS_TEMPLATE_URL = 'https://raw.githubusercontent.com/Gravitate-Health/lens-template/refs/heads/main/my-lens.js';
const LENS_TEMPLATE_REPO = 'https://github.com/Gravitate-Health/lens-template.git';

export default class New extends Command {
  static args = {
    name: Args.string({ description: 'name of the lens to create', required: true }),
  }

  static description = 'Creates a new lens with JavaScript file and FHIR bundle.'

  static examples = [
    '<%= config.bin %> <%= command.id %> MyLens',
    '<%= config.bin %> <%= command.id %> MyLens -d',
    '<%= config.bin %> <%= command.id %> MyLens --template',
    '<%= config.bin %> <%= command.id %> MyLens --template --fork',
  ]

  static flags = {
    default: Flags.boolean({ char: 'd', description: 'use default values for the bundle', required: false }),
    force: Flags.boolean({ char: 'f', description: 'overwrite existing files if they exist', required: false }),
    fork: Flags.boolean({ description: 'fork the template repository using GitHub CLI (requires gh CLI)', required: false }),
    template: Flags.boolean({ char: 't', description: 'clone the full lens-template repository with all features', required: false }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(New);

    spinner.start('Starting process...');

    try {
      if (flags.template) {
        // Use template repository cloning approach
        await this.createFromTemplate(args.name, flags.default, flags.force, flags.fork);
      } else {
        // Original approach: fetch single file
        await this.createSimpleLens(args.name, flags.default, flags.force);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.fail(`Error: ${message}`);
      this.error(message, { exit: 1 });
    }
  }

  private async createSimpleLens(name: string, useDefaults: boolean, force: boolean): Promise<void> {
    // Check if files already exist (unless force flag is set)
    if (!force) {
      const jsFileName = `${name}.js`;
      const bundleFileName = `${name}.json`;
      
      if (fs.existsSync(jsFileName)) {
        spinner.fail(`File ${jsFileName} already exists. Use --force (-f) to overwrite.`);
        throw new Error('File exists');
      }
      
      if (fs.existsSync(bundleFileName)) {
        spinner.fail(`File ${bundleFileName} already exists. Use --force (-f) to overwrite.`);
        throw new Error('File exists');
      }
    }

    // Fetch template from URL
    changeSpinnerText('Fetching lens template from repository...', spinner);
    let lensTemplate: string;
    try {
      lensTemplate = await this.fetchLensTemplate();
      stopAndPersistSpinner('Lens template fetched successfully', spinner);
    } catch (error) {
      spinner.fail(`Error fetching lens template: ${error}`);
      throw error;
    }

    if (useDefaults) {
      this.createLensWithDefaults(name, lensTemplate);
    } else {
      await this.createLensInteractive(name, lensTemplate);
    }
  }

  private async createFromTemplate(name: string, useDefaults: boolean, force: boolean, useFork: boolean): Promise<void> {
    const targetDirName = name.toLowerCase().replaceAll(/\s+/g, '-');
    
    // Check if current directory is empty - if so, use it instead of creating subdirectory
    const currentDirFiles = fs.readdirSync('.');
    const isCurrentDirEmpty = currentDirFiles.length === 0 || 
      (currentDirFiles.length === 1 && currentDirFiles[0] === '.git');
    
    const targetDir = isCurrentDirEmpty ? '.' : targetDirName;
    const displayDir = isCurrentDirEmpty ? 'current directory' : targetDirName;

    // Check if directory already exists (only for non-current directory)
    if (!isCurrentDirEmpty && !force && fs.existsSync(targetDir)) {
      spinner.fail(`Directory ${targetDir} already exists. Use --force (-f) to overwrite.`);
      throw new Error('Directory exists');
    }

    if (!isCurrentDirEmpty && force && fs.existsSync(targetDir)) {
      changeSpinnerText(`Removing existing directory: ${targetDir}`, spinner);
      fs.rmSync(targetDir, { force: true, recursive: true });
      stopAndPersistSpinner('Existing directory removed', spinner);
    }

    // Check if forking is requested
    if (useFork) {
      await this.forkAndCloneTemplate(targetDir, targetDirName, displayDir);
    } else {
      await this.cloneTemplate(targetDir, displayDir);
    }

    // Update package.json
    await this.updatePackageJson(targetDir, name, useDefaults);

    // Rename lens files
    await this.renameLensFiles(targetDir, name);

    // Synchronize metadata from package.json to Library
    await this.syncMetadata(targetDir, name);

    // Update README files
    await this.updateReadmeFiles(targetDir);

    // Final summary
    this.displaySummary(displayDir, name);
  }

  private async forkAndCloneTemplate(targetDir: string, repoName: string, displayDir: string): Promise<void> {
    // Check if gh CLI is available
    changeSpinnerText('Checking for GitHub CLI (gh)...', spinner);
    try {
      await execAsync('gh --version');
      stopAndPersistSpinner('GitHub CLI found', spinner);
    } catch {
      spinner.fail('GitHub CLI (gh) not found. Install from https://cli.github.com or use without --fork flag.');
      throw new Error('GitHub CLI not installed');
    }

    // Fork the repository with new name
    changeSpinnerText(`Forking lens-template as ${repoName}...`, spinner);
    try {
      await execAsync(`gh repo fork Gravitate-Health/lens-template --fork-name ${repoName} --clone=false`);
      stopAndPersistSpinner(`Repository forked as ${repoName}`, spinner);
    } catch (error) {
      spinner.fail(`Failed to fork repository as ${repoName}. You may have already forked it with this name.`);
      // Continue anyway - user might have already forked
    }

    // Get user's GitHub username
    changeSpinnerText('Getting GitHub username...', spinner);
    let username: string;
    try {
      const { stdout } = await execAsync('gh api user --jq .login');
      username = stdout.trim();
      stopAndPersistSpinner(`GitHub username: ${username}`, spinner);
    } catch {
      spinner.fail('Failed to get GitHub username');
      throw new Error('Could not retrieve GitHub username');
    }

    // Clone from fork
    changeSpinnerText(`Cloning from your fork: ${username}/${repoName}...`, spinner);
    try {
      const cloneCmd = targetDir === '.' 
        ? `git clone https://github.com/${username}/${repoName}.git . `
        : `git clone https://github.com/${username}/${repoName}.git ${targetDir}`;
      await execAsync(cloneCmd);
      stopAndPersistSpinner(`Repository cloned to ${displayDir}`, spinner);
    } catch (error) {
      spinner.fail(`Failed to clone repository: ${error}`);
      throw error;
    }

    // Remove .git directory to start fresh
    changeSpinnerText('Removing .git directory...', spinner);
    const gitDir = path.join(targetDir, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { force: true, recursive: true });
      stopAndPersistSpinner('Git history removed', spinner);
    }
  }

  private async cloneTemplate(targetDir: string, displayDir: string): Promise<void> {
    changeSpinnerText('Cloning lens-template repository...', spinner);
    try {
      const cloneCmd = targetDir === '.' 
        ? `git clone ${LENS_TEMPLATE_REPO} . `
        : `git clone ${LENS_TEMPLATE_REPO} ${targetDir}`;
      await execAsync(cloneCmd);
      stopAndPersistSpinner(`Repository cloned to ${displayDir}`, spinner);
    } catch (error) {
      spinner.fail(`Failed to clone repository: ${error}`);
      throw error;
    }

    // Remove .git directory
    changeSpinnerText('Removing .git directory...', spinner);
    const gitDir = path.join(targetDir, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { force: true, recursive: true });
      stopAndPersistSpinner('Git history removed', spinner);
    }
  }

  private async updatePackageJson(targetDir: string, lensName: string, useDefaults: boolean): Promise<void> {
    const packageJsonPath = path.join(targetDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      spinner.warn('package.json not found in template');
      return;
    }

    changeSpinnerText('Reading package.json...', spinner);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    stopAndPersistSpinner('package.json loaded', spinner);

    let updatedPackageJson: any;

    if (useDefaults) {
      // Use defaults with lens name
      updatedPackageJson = {
        ...packageJson,
        author: packageJson.author || 'Your Name <you@example.com>',
        description: packageJson.description || `${lensName} lens for Gravitate Health`,
        name: lensName.toLowerCase().replaceAll(/\s+/g, '-'),
        version: '1.0.0',
      };
      
      changeSpinnerText('Updating package.json with default values...', spinner);
      fs.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
      stopAndPersistSpinner('package.json updated with defaults', spinner);
    } else {
      // Interactive prompts
      spinner.stop();
      const answers = await inquirer.prompt([
        {
          default: lensName.toLowerCase().replaceAll(/\s+/g, '-'),
          message: 'Package name:',
          name: 'name',
          type: 'input',
        },
        {
          default: '1.0.0',
          message: 'Version:',
          name: 'version',
          type: 'input',
        },
        {
          default: `${lensName} lens for Gravitate Health`,
          message: 'Description:',
          name: 'description',
          type: 'input',
        },
        {
          default: packageJson.author || 'Your Name <you@example.com>',
          message: 'Author:',
          name: 'author',
          type: 'input',
        },
        {
          default: packageJson.license || 'Apache-2.0',
          message: 'License:',
          name: 'license',
          type: 'input',
        },
      ]);

      updatedPackageJson = {
        ...packageJson,
        ...answers,
      };

      spinner.start();
      changeSpinnerText('Updating package.json...', spinner);
      fs.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
      stopAndPersistSpinner('package.json updated', spinner);
    }
  }

  private async renameLensFiles(targetDir: string, lensName: string): Promise<void> {
    const newJsName = `${lensName.toLowerCase().replaceAll(/\s+/g, '-')}.js`;
    const newJsonName = `${lensName.toLowerCase().replaceAll(/\s+/g, '-')}.json`;

    // Rename my-lens.js
    const oldJsPath = path.join(targetDir, 'my-lens.js');
    const newJsPath = path.join(targetDir, newJsName);
    
    if (fs.existsSync(oldJsPath)) {
      changeSpinnerText(`Renaming my-lens.js to ${newJsName}...`, spinner);
      fs.renameSync(oldJsPath, newJsPath);
      stopAndPersistSpinner(`Renamed to ${newJsName}`, spinner);
    }

    // Rename my-lens.json if it exists
    const oldJsonPath = path.join(targetDir, 'my-lens.json');
    const newJsonPath = path.join(targetDir, newJsonName);
    
    if (fs.existsSync(oldJsonPath)) {
      changeSpinnerText(`Renaming my-lens.json to ${newJsonName}...`, spinner);
      fs.renameSync(oldJsonPath, newJsonPath);
      stopAndPersistSpinner(`Renamed to ${newJsonName}`, spinner);
    }
  }

  private async syncMetadata(targetDir: string, lensName: string): Promise<void> {
    const packageJsonPath = path.join(targetDir, 'package.json');
    const jsFileName = `${lensName.toLowerCase().replaceAll(/\s+/g, '-')}.js`;
    const jsFilePath = path.join(targetDir, jsFileName);
    
    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(jsFilePath)) {
      spinner.warn('Cannot sync metadata - package.json or JS file missing');
      return;
    }

    changeSpinnerText('Synchronizing metadata from package.json to FHIR Library...', spinner);

    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Read JS file and convert to base64
    const jsContent = fs.readFileSync(jsFilePath, 'utf8');
    const base64Content = Buffer.from(jsContent, 'binary').toString('base64');

    // Create FHIR Library from package.json
    const bundle = LensFhirResource.fromPackageJson(packageJson, base64Content);

    // Write bundle
    const bundleFileName = `${lensName.toLowerCase().replaceAll(/\s+/g, '-')}.json`;
    const bundleFilePath = path.join(targetDir, bundleFileName);
    fs.writeFileSync(bundleFilePath, JSON.stringify(bundle, null, 2));

    stopAndPersistSpinner(`FHIR Library created: ${bundleFileName}`, spinner);
  }

  private async updateReadmeFiles(targetDir: string): Promise<void> {
    const readmePath = path.join(targetDir, 'README.md');
    const templateReadmePath = path.join(targetDir, 'LENS_README_TEMPLATE.md');

    // Remove original README.md
    if (fs.existsSync(readmePath)) {
      changeSpinnerText('Removing template README.md...', spinner);
      fs.rmSync(readmePath);
      stopAndPersistSpinner('Template README.md removed', spinner);
    }

    // Rename LENS_README_TEMPLATE.md to README.md
    if (fs.existsSync(templateReadmePath)) {
      changeSpinnerText('Renaming LENS_README_TEMPLATE.md to README.md...', spinner);
      fs.renameSync(templateReadmePath, readmePath);
      stopAndPersistSpinner('README.md created from template', spinner);
    }
  }

  private displaySummary(targetDir: string, lensName: string): void {
    spinner.stopAndPersist({
      symbol: '⭐',
      text: 'Lens project created successfully!',
    });

    this.log('');
    this.log('='.repeat(60));
    this.log('✅ Setup Complete!');
    this.log('='.repeat(60));
    this.log('');
    this.log(`📁 Project directory: ${targetDir}`);
    this.log('');
    this.log('📝 Next steps:');
    this.log('  1. cd ' + targetDir);
    this.log('  2. Update README.md with your lens documentation');
    this.log('  3. Edit the lens JavaScript file with your enhancement logic');
    this.log('  4. Run tests: npm test');
    this.log('  5. Bundle and upload when ready');
    this.log('');
    this.log('🎯 Features included:');
    this.log('  • package.json configured with your lens metadata');
    this.log('  • Testing framework ready to use');
    this.log('  • GitHub Actions workflows for CI/CD');
    this.log('  • FHIR Library bundle synchronized from package.json');
    this.log('');
    this.log('💡 Remember to manually update the README.md file!');
    this.log('='.repeat(60));
  }

  private async fetchLensTemplate(): Promise<string> {
    try {
      const response = await fetch(LENS_TEMPLATE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch lens template: ${error}`);
    }
  }

  private createLensWithDefaults(name: string, lensTemplate: string): void {
    changeSpinnerText('Creating new lens with default values', spinner);
    
    // Create JavaScript file
    const jsFileName = `${name}.js`;
    changeSpinnerText(`Creating JavaScript file: ${jsFileName}`, spinner);
    try {
      fs.writeFileSync(jsFileName, lensTemplate);
      stopAndPersistSpinner(`JavaScript file created: ${jsFileName}`, spinner);
    } catch (error) {
      spinner.fail(`Error creating JavaScript file: ${error}`);
      throw error;
    }

    // Convert template to base64
    changeSpinnerText('Converting template to base64...', spinner);
    const base64FileData = this.stringTobase64(lensTemplate);
    stopAndPersistSpinner('Template converted to base64', spinner);

    // Create FHIR bundle
    changeSpinnerText(`Creating FHIR bundle: ${name}`, spinner);
    const bundle = LensFhirResource.defaultValues(name, base64FileData);
    const bundleJson = JSON.stringify(bundle, null, 2);
    const bundleFileName = `${name}.json`;
    
    try {
      fs.writeFileSync(bundleFileName, bundleJson);
      stopAndPersistSpinner(`FHIR bundle created: ${bundleFileName}`, spinner);
    } catch (error) {
      spinner.fail(`Error creating FHIR bundle: ${error}`);
      throw error;
    }

    spinner.stopAndPersist({
      symbol: '⭐',
      text: `Lens created successfully: ${jsFileName} and ${bundleFileName}`,
    });
  }

  private async createLensInteractive(name: string, lensTemplate: string): Promise<void> {
    changeSpinnerText('Creating new lens', spinner);
    
    // Create JavaScript file first
    const jsFileName = `${name}.js`;
    changeSpinnerText(`Creating JavaScript file: ${jsFileName}`, spinner);
    try {
      fs.writeFileSync(jsFileName, lensTemplate);
      stopAndPersistSpinner(`JavaScript file created: ${jsFileName}`, spinner);
    } catch (error) {
      spinner.fail(`Error creating JavaScript file: ${error}`);
      throw error;
    }

    // Convert template to base64
    changeSpinnerText('Converting template to base64...', spinner);
    const base64FileData = this.stringTobase64(lensTemplate);
    stopAndPersistSpinner('Template converted to base64', spinner);

    // Ask for bundle metadata
    const answers = await inquirer.prompt([
      {
        default: name,
        message: 'Enter the name of the lens:',
        name: 'name',
        type: 'input',
      },
      {
        message: 'Enter a description for the lens:',
        name: 'description',
        type: 'input',
      },
      {
        message: 'Enter the usage of the lens:',
        name: 'usage',
        type: 'input',
      },
      {
        message: 'Enter the purpose of the lens:',
        name: 'purpose',
        type: 'input',
      }
    ]);

    changeSpinnerText(`Creating FHIR bundle: ${answers.name}`, spinner);
    const bundle = LensFhirResource.interactiveValues(
      answers.name,
      answers.description,
      answers.purpose,
      answers.usage,
      base64FileData
    );
    
    const bundleJson = JSON.stringify(bundle, null, 2);
    const bundleFileName = `${answers.name}.json`;
    
    try {
      fs.writeFileSync(bundleFileName, bundleJson);
      stopAndPersistSpinner(`FHIR bundle created: ${bundleFileName}`, spinner);
      spinner.stopAndPersist({
        symbol: '⭐',
        text: `Lens created successfully: ${jsFileName} and ${bundleFileName}`,
      });
    } catch (error) {
      spinner.fail(`Error creating FHIR bundle: ${error}`);
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
