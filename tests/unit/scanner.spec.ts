import { describe, it, expect, beforeAll } from 'vitest';
import {
  calculateDocumentDimensions,
  warpPerspectiveImageData,
  type QuadCorners,
} from '@/utils/scannerGeometry';
import {
  applyMagicColor,
  applyBradleyAdaptiveThreshold,
  applyOtsuThreshold,
  applyGrayscaleSharpen,
  adjustBrightnessContrast,
} from '@/utils/scannerFilters';

beforeAll(() => {
  if (typeof globalThis.ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
      width: number;
      height: number;
      data: Uint8ClampedArray;
      constructor(arg1: any, arg2?: any, arg3?: any) {
        if (arg1 instanceof Uint8ClampedArray) {
          this.data = arg1;
          this.width = arg2;
          this.height = arg3;
        } else {
          this.width = arg1;
          this.height = arg2;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        }
      }
    } as any;
  }
});

describe('Document Scanner Geometry & Homography', () => {
  it('calculates optimal document dimensions from 4 corners', () => {
    const quad: QuadCorners = {
      topLeft: { x: 10, y: 10 },
      topRight: { x: 510, y: 15 },
      bottomRight: { x: 520, y: 710 },
      bottomLeft: { x: 5, y: 700 },
    };

    const dims = calculateDocumentDimensions(quad);
    expect(dims.width).toBeGreaterThanOrEqual(500);
    expect(dims.height).toBeGreaterThanOrEqual(690);
  });

  it('correctly warps an ImageData using 4-point perspective inverse mapping', () => {
    const width = 100;
    const height = 100;
    const srcData = new ImageData(width, height);

    // Fill with pattern
    for (let i = 0; i < srcData.data.length; i += 4) {
      srcData.data[i] = 200;     // R
      srcData.data[i + 1] = 100; // G
      srcData.data[i + 2] = 50;  // B
      srcData.data[i + 3] = 255; // A
    }

    const quad: QuadCorners = {
      topLeft: { x: 10, y: 10 },
      topRight: { x: 90, y: 15 },
      bottomRight: { x: 85, y: 85 },
      bottomLeft: { x: 15, y: 90 },
    };

    const warped = warpPerspectiveImageData(srcData, quad, 80, 80);
    expect(warped.width).toBe(80);
    expect(warped.height).toBe(80);
    expect(warped.data.length).toBe(80 * 80 * 4);
    expect(warped.data[3]).toBe(255); // Alpha is 255
  });
});

describe('CamScanner Image Filters', () => {
  function createSampleImageData(width = 50, height = 50): ImageData {
    const img = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        // Gradient background with a dark line in the middle
        const isDarkLine = x === 25;
        const val = isDarkLine ? 30 : Math.min(240, 150 + x);
        img.data[idx] = val;
        img.data[idx + 1] = val;
        img.data[idx + 2] = val;
        img.data[idx + 3] = 255;
      }
    }
    return img;
  }

  it('applies Magic Color filter without throwing and produces valid output', () => {
    const sample = createSampleImageData();
    const result = applyMagicColor(sample);

    expect(result.width).toBe(sample.width);
    expect(result.height).toBe(sample.height);
    expect(result.data.length).toBe(sample.data.length);
    // Values should be in 0-255 range
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i]).toBeGreaterThanOrEqual(0);
      expect(result.data[i]).toBeLessThanOrEqual(255);
    }
  });

  it('applies Bradley Adaptive Thresholding producing crisp binary output (0 or 255)', () => {
    const sample = createSampleImageData();
    const result = applyBradleyAdaptiveThreshold(sample);

    expect(result.width).toBe(sample.width);
    expect(result.height).toBe(sample.height);

    // Each color channel should be either 0 or 255
    let hasBlack = false;
    let hasWhite = false;
    for (let i = 0; i < result.data.length; i += 4) {
      const val = result.data[i];
      expect(val === 0 || val === 255).toBe(true);
      if (val === 0) hasBlack = true;
      if (val === 255) hasWhite = true;
    }
    expect(hasBlack).toBe(true);
    expect(hasWhite).toBe(true);
  });

  it('applies Otsu global thresholding', () => {
    const sample = createSampleImageData();
    const result = applyOtsuThreshold(sample);

    expect(result.width).toBe(sample.width);
    for (let i = 0; i < result.data.length; i += 4) {
      expect(result.data[i] === 0 || result.data[i] === 255).toBe(true);
    }
  });

  it('applies Grayscale and Laplacian Sharpening', () => {
    const sample = createSampleImageData();
    const result = applyGrayscaleSharpen(sample, 0.5);

    expect(result.width).toBe(sample.width);
    expect(result.height).toBe(sample.height);
  });

  it('adjusts brightness and contrast linearly', () => {
    const sample = createSampleImageData();
    const brighter = adjustBrightnessContrast(sample, 20, 10);

    expect(brighter.width).toBe(sample.width);
    // Middle pixel was 30, with +20 brightness should increase
    const midIdx = (25 * 50 + 25) * 4;
    expect(brighter.data[midIdx]).toBeGreaterThan(sample.data[midIdx]);
  });
});
