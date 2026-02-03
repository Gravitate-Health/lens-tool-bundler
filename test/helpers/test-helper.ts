import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface TestContext {
  cleanup: () => void;
  testDir: string;
}

/**
 * Creates a temporary directory for testing
 * @returns TestContext with testDir path and cleanup function
 */
export function createTestDirectory(): TestContext {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lens-tool-test-'));
  
  const cleanup = () => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  };

  return { testDir, cleanup };
}

/**
 * Creates a mock enhance function JavaScript file
 * @param filePath - Path where to create the file
 * @param functionName - Name of the function (default: 'enhance')
 */
export function createMockEnhanceFile(filePath: string, functionName: string = 'enhance'): void {
  const content = `function ${functionName}(epi) {
  // Mock enhance function for testing
  console.log('Enhancing EPI');
  return epi;
}

module.exports = ${functionName};
`;
  fs.writeFileSync(filePath, content);
}

/**
 * Creates a mock FHIR Library JSON file
 * @param filePath - Path where to create the file
 * @param name - Name of the lens
 * @param includeBase64 - Whether to include base64 content
 */
export function createMockLensFile(filePath: string, name: string, includeBase64: boolean = true): void {
  const base64Content = includeBase64 
    ? Buffer.from('function enhance(epi) { return epi; }').toString('base64')
    : '';

  const lensData = {
    resourceType: 'Library',
    id: name.toLowerCase().replaceAll(/\s+/g, '-'),
    name: name,
    status: 'draft',
    url: `http://hl7.eu/fhir/ig/gravitate-health/Library/${name}`,
    version: '1.0.0',
    date: new Date().toISOString(),
    content: [
      {
        contentType: 'application/javascript',
        data: base64Content
      }
    ]
  };

  fs.writeFileSync(filePath, JSON.stringify(lensData, null, 2));
}

/**
 * Reads and decodes base64 content from a FHIR Library JSON file
 * @param filePath - Path to the JSON file
 * @returns Decoded content or null if not found
 */
export function readBase64ContentFromLens(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lensData = JSON.parse(content);

  if (lensData.content && Array.isArray(lensData.content) && lensData.content[0]?.data) {
    return Buffer.from(lensData.content[0].data, 'base64').toString('utf8');
  }

  return null;
}

/**
 * Reads raw base64 content from a FHIR Library JSON file (without decoding)
 * @param filePath - Path to the JSON file
 * @returns Base64 string or null if not found
 */
export function readRawBase64FromLens(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lensData = JSON.parse(content);

  if (lensData.content && Array.isArray(lensData.content) && lensData.content[0]?.data) {
    return lensData.content[0].data;
  }

  return null;
}

/**
 * Creates a package.json file for lens template testing
 * @param filePath - Path where to create the file
 * @param name - Name of the lens
 */
export function createPackageJson(filePath: string, name: string): void {
  const packageData = {
    name: name.toLowerCase().replaceAll(/\s+/g, '-'),
    version: '1.0.0',
    description: `${name} lens for testing`,
    author: 'Test Author <test@example.com>',
    license: 'Apache-2.0',
    purpose: 'Testing purpose',
    usage: 'Testing usage',
    copyright: '© 2026 Test'
  };

  fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2));
}

/**
 * Waits for a file to exist (with timeout)
 * @param filePath - Path to the file
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise that resolves when file exists or rejects on timeout
 */
export function waitForFile(filePath: string, timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkFile = () => {
      if (fs.existsSync(filePath)) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`File ${filePath} not found after ${timeout}ms`));
      } else {
        setTimeout(checkFile, 100);
      }
    };

    checkFile();
  });
}
