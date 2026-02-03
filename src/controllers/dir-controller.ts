import * as fs from 'node:fs';
import path from 'node:path';

import {getFileData, toBase64Utf8} from './file-controller.js';

export interface ValidationResult {
  errors: string[];
  isValid: boolean;
}

export interface EnhanceFiles {
  exact: Record<string, string>;
  fallback: Record<string, string[]>;
}

export interface LensEntry {
  enhancedWithJs?: string;
  enhanceSource?: string;
  hasBase64: boolean;
  lens: Record<string, unknown>;
  name: string;
  path: string;
  status: string;
  url: string;
  version: string;
}

/**
 * Validates if a JSON object conforms to FHIR Lens profile
 * @param lens - The lens object to validate
 * @returns ValidationResult with isValid flag and error messages
 */
export function validateFHIRLens(lens: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!lens || typeof lens !== 'object') {
    return {errors: ['Lens must be a JSON object'], isValid: false};
  }

  if (lens.resourceType !== 'Library') {
    errors.push('resourceType must be "Library"');
  }

  if (!lens.url || typeof lens.url !== 'string') {
    errors.push('url is required and must be a string');
  }

  if (!lens.name || typeof lens.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!lens.status || typeof lens.status !== 'string') {
    errors.push('status is required and must be a string');
  }

  if (Array.isArray(lens.content)) {
    let hasBase64Content = false;
    for (const item of lens.content) {
      if (item.data && typeof item.data === 'string') {
        hasBase64Content = true;
        break;
      }
    }

    if (!hasBase64Content) {
      errors.push('content must include at least one item with base64 encoded data');
    }
  } else {
    errors.push('content must be an array');
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
}

/**
 * Recursively find all JSON files in a directory
 * @param dir - The directory to search
 * @returns Array of JSON file paths
 */
export function findJsonFiles(dir: string): string[] {
  const jsonFiles: string[] = [];

  function traverse(currentDir: string): void {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        traverse(filePath);
      } else if (path.extname(file) === '.json') {
        jsonFiles.push(filePath);
      }
    }
  }

  traverse(dir);
  return jsonFiles;
}

/**
 * Find JavaScript files with an enhance function
 * @param dir - The directory to search
 * @returns EnhanceFiles object with exact and fallback matches
 */
export function findEnhanceFiles(dir: string): EnhanceFiles {
  const enhanceFiles: EnhanceFiles = {
    exact: {},      // Map of JSON file path to matching JS file path
    fallback: {},    // Map of directory to array of JS file paths with enhance functions
  };

  function traverse(currentDir: string): void {
    const files = fs.readdirSync(currentDir);
    const jsFilesInDir: string[] = [];

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        traverse(filePath);
      } else if (path.extname(file) === '.js') {
        try {
          const content = getFileData(filePath);
          // Check if the file contains an enhance function using regex
          const enhancePatterns = [
            /function\s+enhance\s*\(/,
            /const\s+enhance\s*=/,
            /let\s+enhance\s*=/,
            /var\s+enhance\s*=/,
            /enhance\s*:\s*function/,
            /enhance\s*:\s*async\s+function/,
            /enhance:\s*enhance/,
          ];

          const hasEnhance = enhancePatterns.some(pattern => pattern.test(content));

          if (hasEnhance) {
            // Store mapping from potential JSON file name to JS file path
            const baseName = path.basename(file, '.js');
            const jsonFilePath = path.join(currentDir, baseName + '.json');
            enhanceFiles.exact[jsonFilePath] = filePath;

            // Also track all JS files with enhance in this directory for fallback
            jsFilesInDir.push(filePath);
          }
        } catch {
          // Skip files that can't be read
        }
      }
    }

    // Store fallback options for this directory
    if (jsFilesInDir.length > 0) {
      enhanceFiles.fallback[currentDir] = jsFilesInDir;
    }
  }

  traverse(dir);
  return enhanceFiles;
}

/**
 * Convert JavaScript file content to base64
 * @param filePath - Path to the JavaScript file
 * @returns Base64 encoded string
 */
export function jsToBase64(filePath: string): string {
  const content = getFileData(filePath);
  return toBase64Utf8(content);
}

/**
 * Get default enhance function as base64
 * @returns Base64 encoded default enhance function
 */
function getDefaultEnhanceBase64(): string {
  const defaultEnhance = `function enhance(originalContent) {
    console.log('Not Enhancing');
    return originalContent;
}`;
  return toBase64Utf8(defaultEnhance);
}

function isLensMissingBase64Content(jsonData: Record<string, unknown>): boolean {
  // Determine if the lens is missing base64 content and needs enhancement.
  if (!jsonData.content || !Array.isArray(jsonData.content) || jsonData.content.length === 0) {
    return true;
  }

  if (jsonData.content.length === 1) {
    const item = jsonData.content[0];
    if (!item || typeof item.data !== 'string' || item.data.length === 0) {
      return true;
    }

    return false;
  }

  // length > 1: check if any item has non-empty string data
  const hasAnyData = jsonData.content.some((c: unknown) => {
    const content = c as Record<string, unknown>;
    return content && typeof content.data === 'string' && content.data.length > 0;
  });
  return !hasAnyData;
}

/**
 * Discover and validate lenses from a folder
 * @param lensFilePath - Path to lens file or directory
 * @returns Promise resolving to array of LensEntry objects
 */
export async function discoverLenses(lensFilePath: string): Promise<LensEntry[]> {
  try {
    const lensFiles = findJsonFiles(lensFilePath);
    const enhanceFiles = findEnhanceFiles(lensFilePath);

    const validLenses: LensEntry[] = [];

    for (const filePath of lensFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(content);

        const validation = validateFHIRLens(jsonData);

        if (validation.isValid) {
          console.log(`Valid lens found: ${jsonData.name} in file ${filePath}`);
          // Lens is valid
          validLenses.push({
            hasBase64: true,
            lens: jsonData,
            name: jsonData.name,
            path: filePath,
            status: jsonData.status,
            url: jsonData.url,
            version: jsonData.version || 'unknown',
          });
        } else if ((validation.errors.length === 1 && validation.errors[0].includes('content')) && isLensMissingBase64Content(jsonData)) {
          // Prioritize JS file with the same name as the JSON file
          let enhanceFile = enhanceFiles.exact[filePath];
          let enhanceSource = 'exact-match';

          console.debug(`Lens ${jsonData.name} is missing base64 content. Looking for enhance JS with matching name: ${filePath}`);

          // If no exact match, look for any JS file in the same directory
          if (!enhanceFile) {
            const fileDir = path.dirname(filePath);
            const fallbackFiles = enhanceFiles.fallback[fileDir];
            if (fallbackFiles && fallbackFiles.length > 0) {
              enhanceFile = fallbackFiles[0]; // Use the first available JS file
              enhanceSource = 'fallback';
              console.debug(`No exact match found, using fallback enhance JS: ${enhanceFile}`);
            }
          }

          let base64Content: string;

          if (enhanceFile) {
            console.log(`Enhancing lens ${jsonData.name} with JS file ${enhanceFile} (${enhanceSource})`);
            try {
              base64Content = jsToBase64(enhanceFile);
            } catch (jsError: unknown) {
              const message = jsError instanceof Error ? jsError.message : String(jsError);
              console.debug(`Failed to enhance lens with JS: ${message}, using default enhance`);
              base64Content = getDefaultEnhanceBase64();
              enhanceFile = '';
              enhanceSource = 'default';
            }
          } else {
            console.log(`No enhance JS found for lens ${jsonData.name}, using default enhance function`);
            base64Content = getDefaultEnhanceBase64();
            enhanceSource = 'default';
          }

          try {
            jsonData.content = jsonData.content || [];
            if (jsonData.content.length === 0) {
              jsonData.content.push({});
            }

            jsonData.content[0].data = base64Content;

            const revalidation = validateFHIRLens(jsonData);
            if (revalidation.isValid) {
              const lensEntry: LensEntry = {
                hasBase64: true,
                lens: jsonData,
                name: jsonData.name,
                path: filePath,
                status: jsonData.status,
                url: jsonData.url,
                version: jsonData.version || 'unknown',
              };

              if (enhanceFile) {
                lensEntry.enhancedWithJs = enhanceFile;
              }

              if (enhanceSource) {
                lensEntry.enhanceSource = enhanceSource;
              }

              validLenses.push(lensEntry);
            }
          } catch (enhanceError: unknown) {
            const message = enhanceError instanceof Error ? enhanceError.message : String(enhanceError);
            console.debug(`Failed to enhance lens ${jsonData.name}: ${message}`);
          }
        } else {
          console.debug(`Invalid lens in file ${filePath}: ${validation.errors.join('; ')}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.debug(`Error processing file ${filePath}: ${message}`);
      }
    }

    return validLenses;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error discovering lenses:', message);
    throw error;
  }
}
