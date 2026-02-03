import chardet from 'chardet'
import iconv from 'iconv-lite'
import * as fs from 'node:fs'

import {LensFhirResource} from '../models/lens-fhir-resource.js';

export interface DecodedFileData {
  content: string;
  encoding: string;
}

function stripBom(content: string): string {
  return content.replace(/^\uFEFF/, '');
}

function resolveEncoding(buffer: Buffer, sourceEncoding?: string): string {
  const detected = sourceEncoding ?? chardet.detect(buffer) ?? 'utf8';
  const encoding = typeof detected === 'string' ? detected : 'utf8';

  if (!iconv.encodingExists(encoding)) {
    throw new Error(`Unsupported source encoding: ${encoding}`);
  }

  return encoding;
}

export function getFileData(file: string, sourceEncoding?: string): string {
  const {content} = getFileDataWithEncoding(file, sourceEncoding);
  return content;
}

export function getFileDataWithEncoding(file: string, sourceEncoding?: string): DecodedFileData {
  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(file);
  } catch (error) {
    console.log('Error reading file:', error);
    throw error;
  }

  const encoding = resolveEncoding(buffer, sourceEncoding);
  const content = stripBom(iconv.decode(buffer, encoding));

  return {content, encoding};
}

export function toBase64Utf8(content: string): string {
  return Buffer.from(content, 'utf8').toString('base64');
}

export function writeBundleToFile(bundle: LensFhirResource, base64Content: string): void {
  const bundleFileName = `${bundle.name}.json`;

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
