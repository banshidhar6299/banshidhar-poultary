import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateFileSignature } from '../src/middlewares/upload';

describe('Upload Security & File Signature Verification', () => {
  const tmpDir = path.join(__dirname, '../uploads');

  it('validates a genuine JPEG header (FF D8 FF)', () => {
    const testJpegPath = path.join(tmpDir, 'test-valid.jpg');
    fs.mkdirSync(tmpDir, { recursive: true });
    // Write genuine JPEG magic bytes
    fs.writeFileSync(testJpegPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]));

    const isValid = validateFileSignature(testJpegPath, 'image/jpeg');
    expect(isValid).toBe(true);

    try { fs.unlinkSync(testJpegPath); } catch {}
  });

  it('validates a genuine PNG header (89 50 4E 47)', () => {
    const testPngPath = path.join(tmpDir, 'test-valid.png');
    fs.mkdirSync(tmpDir, { recursive: true });
    // Write genuine PNG magic bytes
    fs.writeFileSync(testPngPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]));

    const isValid = validateFileSignature(testPngPath, 'image/png');
    expect(isValid).toBe(true);

    try { fs.unlinkSync(testPngPath); } catch {}
  });

  it('rejects a disguised executable/script renamed to .png (MZ header)', () => {
    const testDisguisedPath = path.join(tmpDir, 'malicious.png');
    fs.mkdirSync(tmpDir, { recursive: true });
    // Write DOS/PE executable header (MZ)
    fs.writeFileSync(testDisguisedPath, Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]));

    const isValid = validateFileSignature(testDisguisedPath, 'image/png');
    expect(isValid).toBe(false);

    try { fs.unlinkSync(testDisguisedPath); } catch {}
  });

  it('rejects an HTML/text file disguised as JPEG', () => {
    const testHtmlPath = path.join(tmpDir, 'fake.jpg');
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(testHtmlPath, Buffer.from('<html><script>alert(1)</script></html>'));

    const isValid = validateFileSignature(testHtmlPath, 'image/jpeg');
    expect(isValid).toBe(false);

    try { fs.unlinkSync(testHtmlPath); } catch {}
  });
});
