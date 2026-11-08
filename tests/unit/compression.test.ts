import { describe, it, expect } from "vitest";
import {
  stripExifBytes,
  hasExifBytes,
} from "../../lib/image-compression";

/**
 * Creates a synthetic JPEG byte buffer containing an EXIF APP1 header.
 */
function createSyntheticJpegWithExif(): Uint8Array {
  // EXIF payload: 'Exif\0\0' followed by dummy TIFF header and tags
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  const dummyTiff = [0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]; // II (little endian), version 42
  const app1Payload = [...exifHeader, ...dummyTiff];
  const app1Length = app1Payload.length + 2;

  // APP1 segment: 0xFF, 0xE1, length (2 bytes high/low), payload
  const app1Segment = [
    0xff,
    0xe1,
    (app1Length >> 8) & 0xff,
    app1Length & 0xff,
    ...app1Payload,
  ];

  // Dummy image payload after APP1 (e.g. SOS and scan data)
  const dummyScan = [0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xaa, 0xbb, 0xcc];
  // EOI marker
  const eoi = [0xff, 0xd9];

  // Full JPEG: SOI (0xFF, 0xD8) + APP1 + dummy scan + EOI
  return new Uint8Array([0xff, 0xd8, ...app1Segment, ...dummyScan, ...eoi]);
}

describe("Image compression and EXIF stripping (§5 & §10)", () => {
  it("detects EXIF APP1 metadata in synthetic JPEG bytes", () => {
    const jpegWithExif = createSyntheticJpegWithExif();
    expect(hasExifBytes(jpegWithExif)).toBe(true);
  });

  it("strips EXIF APP1 marker segments and preserves valid JPEG markers", () => {
    const jpegWithExif = createSyntheticJpegWithExif();
    const stripped = stripExifBytes(jpegWithExif);

    expect(hasExifBytes(stripped)).toBe(false);
    expect(stripped.length).toBeLessThan(jpegWithExif.length);
    // Preserves SOI marker (0xFF, 0xD8)
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
    // Preserves EOI marker (0xFF, 0xD9)
    expect(stripped[stripped.length - 2]).toBe(0xff);
    expect(stripped[stripped.length - 1]).toBe(0xd9);
  });

  it("leaves clean JPEGs without EXIF untouched", () => {
    const cleanJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x04, 0x01, 0x02, 0xff, 0xd9]);
    expect(hasExifBytes(cleanJpeg)).toBe(false);
    const result = stripExifBytes(cleanJpeg);
    expect(result.length).toBe(cleanJpeg.length);
    expect(hasExifBytes(result)).toBe(false);
  });

  // R36 (Claude): the test of compressImage that was here ran only the Node-only branch, which returns a hard-coded
  // 1600 x 1600, so it proved nothing. The browser path is tested in tests/e2e/photo-compression.spec.ts.
});

