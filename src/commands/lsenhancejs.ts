import {Args, Command, Flags} from '@oclif/core'
import * as path from 'node:path'

import type {EnhanceFiles} from '../controllers/dir-controller.js';

import * as dirController from '../controllers/dir-controller.js'

export default class Lsenhancejs extends Command {
  static args = {
    directory: Args.string({
      default: '.',
      description: 'directory to search for enhance JS files',
      required: false,
    }),
  }
  static description = 'List valid enhance JavaScript files in a directory (similar to ls).'
  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./lenses',
    '<%= config.bin %> <%= command.id %> -d',
    '<%= config.bin %> <%= command.id %> ./lenses | xargs -I {} echo "Processing: {}"',
  ]
  static flags = {
    details: Flags.boolean({
      char: 'd',
      description: 'show details about matches (exact vs fallback)',
      required: false,
    }),
    json: Flags.boolean({
      char: 'j',
      description: 'output as JSON format',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Lsenhancejs);

    const directory = path.resolve(args.directory);

    try {
      const enhanceFiles = dirController.findEnhanceFiles(directory);

      // Collect all unique JS files
      const allJsFiles = new Set<string>();
      const exactMatches = new Set<string>();

      // Add exact match files
      for (const jsPath of Object.values(enhanceFiles.exact)) {
        allJsFiles.add(jsPath as string);
        exactMatches.add(jsPath as string);
      }

      // Add fallback files
      for (const jsFiles of Object.values(enhanceFiles.fallback)) {
        for (const jsFile of jsFiles as string[]) {
          allJsFiles.add(jsFile);
        }
      }

      const sortedFiles = [...allJsFiles].sort();

      if (sortedFiles.length === 0) {
        if (!flags.json) {
          this.log('No valid enhance JavaScript files found.');
        }

        return;
      }

      if (flags.json) {
        // Output as JSON for programmatic use
        this.outputJson(sortedFiles, exactMatches, enhanceFiles, flags.details);
      } else if (flags.details) {
        // Output with details about matches
        this.outputWithDetails(sortedFiles, exactMatches, enhanceFiles);
      } else {
        // Simple output - just file paths (useful for xargs)
        this.outputSimple(sortedFiles);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(`Error listing enhance JS files: ${message}`);
    }
  }

  private outputJson(files: string[], exactMatches: Set<string>, enhanceFiles: EnhanceFiles, includeDetails: boolean): void {
    const output = files.map((file: string) => {
      const result: Record<string, unknown> = {
        path: file,
      };

      if (includeDetails) {
        const isExact = exactMatches.has(file);
        result.type = isExact ? 'exact' : 'fallback';

        if (isExact) {
          const matchingJsons: string[] = [];
          for (const [jsonPath, jsPath] of Object.entries(enhanceFiles.exact)) {
            if (jsPath === file) {
              matchingJsons.push(jsonPath as string);
            }
          }

          result.matchingJsonFiles = matchingJsons;
        } else {
          result.directory = path.dirname(file);
        }
      }

      return result;
    });

    this.log(JSON.stringify(output, null, 2));
  }

  private outputSimple(files: string[]): void {
    // Output just the file paths, one per line (ideal for xargs)
    for (const file of files) {
      this.log(file);
    }
  }

  private outputWithDetails(files: string[], exactMatches: Set<string>, enhanceFiles: EnhanceFiles): void {
    for (const file of files) {
      this.log(`\n${'='.repeat(60)}`);
      this.log(`File: ${file}`);

      const isExact = exactMatches.has(file);
      this.log(`Type: ${isExact ? 'Exact Match' : 'Fallback'}`);

      if (isExact) {
        // Find which JSON file this matches
        const matchingJsons: string[] = [];
        for (const [jsonPath, jsPath] of Object.entries(enhanceFiles.exact)) {
          if (jsPath === file) {
            matchingJsons.push(jsonPath as string);
          }
        }

        if (matchingJsons.length > 0) {
          this.log('Matches JSON files:');
          for (const jsonPath of matchingJsons) {
            this.log(`  - ${jsonPath}`);
          }
        }
      } else {
        // Find which directory this is a fallback for
        const fileDir = path.dirname(file);
        this.log(`Available as fallback in: ${fileDir}`);
      }
    }

    this.log(`\n${'='.repeat(60)}`);
    this.log(`Total enhance JS files found: ${files.length}`);
  }
}
