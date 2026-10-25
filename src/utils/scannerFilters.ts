/**
 * Document Scanner Image Enhancement Filters (CamScanner Quality)
 * Pure TypeScript / TypedArray implementations - O(N) linear time
 */

/**
 * CamScanner-style Magic Color:
 * Estimates background illumination via a fast separable box blur filter,
 * divides pixel intensities by background luminance (normalizing paper to white),
 * and stretches dynamic range while preserving colored stamps and handwriting ink.
 */
export function applyMagicColor(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const totalPixels = width * height;

  // 1. Grayscale luminance
  const lum = new Float32Array(totalPixels);
  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    lum[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  // 2. Separable 2D Box Blur filter for illumination map estimation
  const radius = Math.max(8, Math.floor(Math.min(width, height) / 28));
  const temp = new Float32Array(totalPixels);
  const bg = new Float32Array(totalPixels);

  // Horizontal Pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    let windowSum = 0;
    let windowCount = 0;

    for (let x = 0; x <= radius && x < width; x++) {
      windowSum += lum[rowOffset + x];
      windowCount++;
    }

    for (let x = 0; x < width; x++) {
      temp[rowOffset + x] = windowSum / windowCount;

      const addIdx = x + radius + 1;
      const subIdx = x - radius;
      if (addIdx < width) {
        windowSum += lum[rowOffset + addIdx];
        windowCount++;
      }
      if (subIdx >= 0) {
        windowSum -= lum[rowOffset + subIdx];
        windowCount--;
      }
    }
  }

  // Vertical Pass
  for (let x = 0; x < width; x++) {
    let windowSum = 0;
    let windowCount = 0;

    for (let y = 0; y <= radius && y < height; y++) {
      windowSum += temp[y * width + x];
      windowCount++;
    }

    for (let y = 0; y < height; y++) {
      bg[y * width + x] = windowSum / windowCount;

      const addIdx = y + radius + 1;
      const subIdx = y - radius;
      if (addIdx < height) {
        windowSum += temp[addIdx * width + x];
        windowCount++;
      }
      if (subIdx >= 0) {
        windowSum -= temp[subIdx * width + x];
        windowCount--;
      }
    }
  }

  // 3. Illumination Division & Dynamic Range Contrast Stretch
  const output = new ImageData(new Uint8ClampedArray(data), width, height);
  const outPixels = output.data;
  const blackPoint = 35;
  const whitePoint = 215;
  const rangeInv = 255 / (whitePoint - blackPoint);

  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    const b = bg[i] < 1 ? 1 : bg[i];
    const scale = 255.0 / b;

    for (let c = 0; c < 3; c++) {
      const normalized = data[p + c] * scale;
      let val = (normalized - blackPoint) * rangeInv;
      if (val < 0) val = 0;
      else if (val > 255) val = 255;
      outPixels[p + c] = val;
    }
  }

  return output;
}

/**
 * Bradley-Roth Adaptive Local Thresholding using Integral Image:
 * Computes threshold per-pixel in O(1) time. Highly effective for text documents under shadows.
 */
export function applyBradleyAdaptiveThreshold(
  imageData: ImageData,
  sensitivityPercent = 14.0,
  windowSize?: number
): ImageData {
  const { width, height, data } = imageData;
  const totalPixels = width * height;
  const wSize = windowSize ?? Math.max(16, Math.round(width / 8));

  // 1. Grayscale luminance
  const gray = new Uint8Array(totalPixels);
  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    gray[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) | 0;
  }

  // 2. Integral image (W+1) x (H+1)
  const intW = width + 1;
  const intH = height + 1;
  const integral = new Float64Array(intW * intH);

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const yRow = y * width;
    const intRow = (y + 1) * intW;
    const prevIntRow = y * intW;

    for (let x = 0; x < width; x++) {
      rowSum += gray[yRow + x];
      integral[intRow + (x + 1)] = integral[prevIntRow + (x + 1)] + rowSum;
    }
  }

  // 3. Threshold calculation
  const output = new ImageData(width, height);
  const outPixels = output.data;
  const s2 = Math.floor(wSize / 2);
  const factor = (100.0 - sensitivityPercent) / 100.0;

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - s2);
    const y2 = Math.min(height - 1, y + s2);
    const yRow = y * width;

    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - s2);
      const x2 = Math.min(width - 1, x + s2);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum = integral[(y2 + 1) * intW + (x2 + 1)]
                - integral[(y2 + 1) * intW + x1]
                - integral[y1 * intW + (x2 + 1)]
                + integral[y1 * intW + x1];

      const pIdx = (yRow + x) << 2;
      const pixelVal = gray[yRow + x];

      const binVal = (pixelVal * count <= sum * factor) ? 0 : 255;
      outPixels[pIdx]     = binVal;
      outPixels[pIdx + 1] = binVal;
      outPixels[pIdx + 2] = binVal;
      outPixels[pIdx + 3] = 255;
    }
  }

  return output;
}

/**
 * Otsu's Global Thresholding (Inter-class variance maximization)
 */
export function applyOtsuThreshold(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const totalPixels = width * height;
  const hist = new Uint32Array(256);

  const gray = new Uint8Array(totalPixels);
  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    const g = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) | 0;
    gray[i] = g;
    hist[g]++;
  }

  let totalSum = 0;
  for (let t = 0; t < 256; t++) totalSum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = 0;
  let optimalThreshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = totalPixels - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (totalSum - sumB) / wF;
    const varBetween = wB * wF * (mB - mF) * (mB - mF);

    if (varBetween > varMax) {
      varMax = varBetween;
      optimalThreshold = t;
    }
  }

  const output = new ImageData(width, height);
  const outData = output.data;
  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    const val = gray[i] < optimalThreshold ? 0 : 255;
    outData[p] = outData[p + 1] = outData[p + 2] = val;
    outData[p + 3] = 255;
  }
  return output;
}

/**
 * Grayscale & Laplacian High-Contrast Sharpening
 */
export function applyGrayscaleSharpen(imageData: ImageData, sharpness = 0.5): ImageData {
  const { width, height, data } = imageData;
  const totalPixels = width * height;
  const gray = new Uint8Array(totalPixels);

  // 1. Grayscale luminance
  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    gray[i] = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) | 0;
  }

  // 2. Linear histogram stretch (clip 2% bounds)
  const hist = new Uint32Array(256);
  for (let i = 0; i < totalPixels; i++) hist[gray[i]]++;

  const lowBound = totalPixels * 0.02;
  const highBound = totalPixels * 0.98;
  let cum = 0, minVal = 0, maxVal = 255;

  for (let i = 0; i < 256; i++) {
    cum += hist[i];
    if (minVal === 0 && cum >= lowBound) minVal = i;
    if (cum >= highBound) { maxVal = i; break; }
  }
  if (maxVal <= minVal) maxVal = minVal + 1;

  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const stretched = ((i - minVal) / (maxVal - minVal)) * 255;
    lut[i] = stretched < 0 ? 0 : stretched > 255 ? 255 : Math.round(stretched);
  }

  const stretchedGray = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    stretchedGray[i] = lut[gray[i]];
  }

  // 3. Laplacian 3x3 Sharpening
  const output = new ImageData(width, height);
  const outPixels = output.data;
  const s = sharpness;
  const centerWeight = 1 + 4 * s;

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    const rowPrev = (y - 1) * width;
    const rowNext = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const pIdx = (row + x) << 2;
      const filtered =
        stretchedGray[row + x] * centerWeight -
        s * (stretchedGray[rowPrev + x] +
             stretchedGray[rowNext + x] +
             stretchedGray[row + x - 1] +
             stretchedGray[row + x + 1]);

      const val = filtered < 0 ? 0 : filtered > 255 ? 255 : Math.round(filtered);
      outPixels[pIdx]     = val;
      outPixels[pIdx + 1] = val;
      outPixels[pIdx + 2] = val;
      outPixels[pIdx + 3] = 255;
    }
  }

  // Copy borders
  for (let x = 0; x < width; x++) {
    const topIdx = x << 2;
    const btmIdx = ((height - 1) * width + x) << 2;
    outPixels[topIdx] = outPixels[topIdx + 1] = outPixels[topIdx + 2] = stretchedGray[x];
    outPixels[topIdx + 3] = 255;
    outPixels[btmIdx] = outPixels[btmIdx + 1] = outPixels[btmIdx + 2] = stretchedGray[(height - 1) * width + x];
    outPixels[btmIdx + 3] = 255;
  }
  for (let y = 0; y < height; y++) {
    const lIdx = (y * width) << 2;
    const rIdx = (y * width + (width - 1)) << 2;
    outPixels[lIdx] = outPixels[lIdx + 1] = outPixels[lIdx + 2] = stretchedGray[y * width];
    outPixels[lIdx + 3] = 255;
    outPixels[rIdx] = outPixels[rIdx + 1] = outPixels[rIdx + 2] = stretchedGray[y * width + (width - 1)];
    outPixels[rIdx + 3] = 255;
  }

  return output;
}

/**
 * Adjust Brightness and Contrast
 * brightness: -100 to 100
 * contrast: -100 to 100
 */
export function adjustBrightnessContrast(
  imageData: ImageData,
  brightness = 0,
  contrast = 0
): ImageData {
  if (brightness === 0 && contrast === 0) return imageData;

  const output = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const data = output.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let val = data[i + c] + brightness;
      val = factor * (val - 128) + 128;
      data[i + c] = Math.max(0, Math.min(255, val));
    }
  }

  return output;
}
