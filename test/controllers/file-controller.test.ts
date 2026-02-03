import {expect} from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {getFileData, getFileDataWithEncoding, toBase64Utf8} from '../../src/controllers/file-controller.js';
import {createTestDirectory, TestContext} from '../helpers/test-helper.js';

describe('file-controller encoding handling', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestDirectory();
  });

  afterEach(() => {
    context.cleanup();
  });

  describe('getFileData and encoding detection', () => {
    it('should read UTF-8 encoded files', () => {
      const filePath = path.join(context.testDir, 'utf8.js');
      const content = 'function enhance(epi) { return epi; }';
      fs.writeFileSync(filePath, content, 'utf8');

      const result = getFileData(filePath);
      expect(result).to.equal(content);
    });

    it('should read UTF-8 files with unicode characters', () => {
      const filePath = path.join(context.testDir, 'unicode.js');
      const content = 'function enhance(epi) { const msg = "Héllo Wörld 🚀"; return epi; }';
      fs.writeFileSync(filePath, content, 'utf8');

      const result = getFileData(filePath);
      expect(result).to.equal(content);
    });

    it('should read latin1 encoded files when specified', () => {
      const filePath = path.join(context.testDir, 'latin1.js');
      const content = 'function enhance(epi) { const msg = "Café"; return epi; }';
      const latin1Buffer = Buffer.from(content, 'latin1');
      fs.writeFileSync(filePath, latin1Buffer);

      const result = getFileData(filePath, 'latin1');
      expect(result).to.equal(content);
    });

    it('should read windows-1252 encoded files when specified', async () => {
      const filePath = path.join(context.testDir, 'windows1252.js');
      const content = 'function enhance(epi) { const msg = "Naïve résumé"; return epi; }';
      
      // Simulate windows-1252 encoding
      const iconv = await import('iconv-lite');
      const encoded = iconv.default.encode(content, 'windows-1252');
      fs.writeFileSync(filePath, encoded);

      const result = getFileData(filePath, 'windows-1252');
      expect(result).to.equal(content);
    });

    it('should strip BOM from UTF-8 files', () => {
      const filePath = path.join(context.testDir, 'utf8-bom.js');
      const content = 'function enhance(epi) { return epi; }';
      const withBom = '\uFEFF' + content;
      fs.writeFileSync(filePath, withBom, 'utf8');

      const result = getFileData(filePath);
      expect(result).to.equal(content);
      expect(result).to.not.include('\uFEFF');
    });
  });

  describe('getFileDataWithEncoding', () => {
    it('should return content and encoding information', () => {
      const filePath = path.join(context.testDir, 'test.js');
      const content = 'function enhance(epi) { return epi; }';
      fs.writeFileSync(filePath, content, 'utf8');

      const result = getFileDataWithEncoding(filePath);
      expect(result).to.have.property('content');
      expect(result).to.have.property('encoding');
      expect(result.content).to.equal(content);
      expect(result.encoding).to.be.a('string');
    });

    it('should use specified encoding', () => {
      const filePath = path.join(context.testDir, 'latin1.js');
      const content = 'function enhance(epi) { return epi; }';
      const latin1Buffer = Buffer.from(content, 'latin1');
      fs.writeFileSync(filePath, latin1Buffer);

      const result = getFileDataWithEncoding(filePath, 'latin1');
      expect(result.encoding).to.equal('latin1');
      expect(result.content).to.equal(content);
    });
  });

  describe('toBase64Utf8', () => {
    it('should convert string to base64 UTF-8', () => {
      const content = 'function enhance(epi) { return epi; }';
      const base64 = toBase64Utf8(content);

      expect(base64).to.be.a('string');
      expect(base64).to.match(/^[A-Za-z0-9+/=]+$/);

      // Verify it can be decoded back
      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      expect(decoded).to.equal(content);
    });

    it('should handle unicode characters correctly', () => {
      const content = 'function enhance() { return "Hello 世界 🌍"; }';
      const base64 = toBase64Utf8(content);

      const decoded = Buffer.from(base64, 'base64').toString('utf8');
      expect(decoded).to.equal(content);
    });

    it('should produce consistent base64 regardless of source encoding', () => {
      const content = 'function enhance() { return "Café"; }';
      
      // Content is the same string, should produce same base64
      const base64_1 = toBase64Utf8(content);
      const base64_2 = toBase64Utf8(content);
      
      expect(base64_1).to.equal(base64_2);
    });
  });

  describe('cross-platform encoding scenarios', () => {
    it('should handle file created on Mac (UTF-16) and read on Linux (UTF-8)', async () => {
      const filePath = path.join(context.testDir, 'mac-file.js');
      const content = 'function enhance(epi) { const msg = "Créé sur Mac"; return epi; }';
      
      // Simulate UTF-16LE encoding (common on Mac)
      const iconv = await import('iconv-lite');
      const utf16Buffer = iconv.default.encode(content, 'utf16le');
      fs.writeFileSync(filePath, utf16Buffer);

      // Read with explicit UTF-16LE encoding (simulating --source-encoding flag)
      const result = getFileData(filePath, 'utf16le');
      expect(result).to.equal(content);

      // Convert to base64 UTF-8 (what gets stored in bundle)
      const base64 = toBase64Utf8(result);
      
      // Later on Linux, auto-detect should work if file is re-encoded as UTF-8
      // Or explicit encoding should produce same base64
      const base64_2 = toBase64Utf8(content);
      expect(base64).to.equal(base64_2);
    });

    it('should handle file created on Windows (Windows-1252) and read on Linux', async () => {
      const filePath = path.join(context.testDir, 'windows-file.js');
      const content = 'function enhance(epi) { const msg = "Naïve café résumé"; return epi; }';
      
      // Simulate Windows-1252 encoding
      const iconv = await import('iconv-lite');
      const win1252Buffer = iconv.default.encode(content, 'windows-1252');
      fs.writeFileSync(filePath, win1252Buffer);

      // Read with explicit encoding
      const result = getFileData(filePath, 'windows-1252');
      expect(result).to.equal(content);

      // Base64 should match UTF-8 encoded version
      const base64 = toBase64Utf8(result);
      const base64_utf8 = toBase64Utf8(content);
      expect(base64).to.equal(base64_utf8);
    });

    it('should handle file with different line endings (CRLF vs LF)', () => {
      const contentLF = 'function enhance(epi) {\n  return epi;\n}';
      const contentCRLF = 'function enhance(epi) {\r\n  return epi;\r\n}';

      // These should produce DIFFERENT base64 because content is actually different
      const base64LF = toBase64Utf8(contentLF);
      const base64CRLF = toBase64Utf8(contentCRLF);

      expect(base64LF).to.not.equal(base64CRLF);
    });

    it('should produce identical base64 from same decoded content', async () => {
      const content = 'function enhance(epi) { return epi; }';
      
      // Create files with different encodings
      const iconv = await import('iconv-lite');
      
      const utf8Path = path.join(context.testDir, 'utf8.js');
      fs.writeFileSync(utf8Path, content, 'utf8');
      
      const latin1Path = path.join(context.testDir, 'latin1.js');
      fs.writeFileSync(latin1Path, iconv.default.encode(content, 'latin1'));
      
      const utf16Path = path.join(context.testDir, 'utf16.js');
      fs.writeFileSync(utf16Path, iconv.default.encode(content, 'utf16le'));

      // Read with appropriate encodings
      const utf8Content = getFileData(utf8Path, 'utf8');
      const latin1Content = getFileData(latin1Path, 'latin1');
      const utf16Content = getFileData(utf16Path, 'utf16le');

      // All should decode to same string
      expect(utf8Content).to.equal(content);
      expect(latin1Content).to.equal(content);
      expect(utf16Content).to.equal(content);

      // All should produce same base64
      const base64_1 = toBase64Utf8(utf8Content);
      const base64_2 = toBase64Utf8(latin1Content);
      const base64_3 = toBase64Utf8(utf16Content);

      expect(base64_1).to.equal(base64_2);
      expect(base64_2).to.equal(base64_3);
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent file', () => {
      const filePath = path.join(context.testDir, 'nonexistent.js');
      
      expect(() => getFileData(filePath)).to.throw();
    });

    it('should throw error for unsupported encoding', () => {
      const filePath = path.join(context.testDir, 'test.js');
      fs.writeFileSync(filePath, 'content');

      expect(() => getFileData(filePath, 'invalid-encoding-xyz')).to.throw(/Unsupported source encoding/);
    });
  });
});
