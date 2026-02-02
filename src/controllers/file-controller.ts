import * as fs from 'node:fs'

import {LensFhirResource} from '../models/lens-fhir-resource.js';

export function getFileData(file: string): string {
  let fileData;
  try {
    fileData = fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.log('Error reading file:', error);
    throw error;
  }

  return fileData;
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
