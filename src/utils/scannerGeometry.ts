export interface Point2D {
  x: number;
  y: number;
}

export interface QuadCorners {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

/**
 * Calculates optimal rectangular target dimensions based on maximum quad edge lengths.
 */
export function calculateDocumentDimensions(quad: QuadCorners): { width: number; height: number } {
  const dist = (p1: Point2D, p2: Point2D) => Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const widthTop = dist(quad.topLeft, quad.topRight);
  const widthBottom = dist(quad.bottomLeft, quad.bottomRight);
  const heightLeft = dist(quad.topLeft, quad.bottomLeft);
  const heightRight = dist(quad.topRight, quad.bottomRight);

  return {
    width: Math.max(100, Math.round(Math.max(widthTop, widthBottom))),
    height: Math.max(100, Math.round(Math.max(heightLeft, heightRight))),
  };
}

/**
 * Warps a 4-point quadrilateral from source ImageData into a rectangular destination ImageData
 * using Heckbert's closed-form inverse mapping with subpixel bilinear interpolation.
 */
export function warpPerspectiveImageData(
  srcData: ImageData,
  quad: QuadCorners,
  targetWidth?: number,
  targetHeight?: number
): ImageData {
  const { width: srcW, height: srcH, data: srcPixels } = srcData;
  const dims = (targetWidth && targetHeight)
    ? { width: targetWidth, height: targetHeight }
    : calculateDocumentDimensions(quad);

  const dstW = dims.width;
  const dstH = dims.height;
  const dstImg = new ImageData(dstW, dstH);
  const dstPixels = dstImg.data;

  const p0 = quad.topLeft;
  const p1 = quad.topRight;
  const p2 = quad.bottomRight;
  const p3 = quad.bottomLeft;

  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const sy = p0.y - p1.y + p2.y - p3.y;

  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number;

  if (Math.abs(sx) < 1e-6 && Math.abs(sy) < 1e-6) {
    a = p1.x - p0.x; b = p3.x - p0.x; c = p0.x;
    d = p1.y - p0.y; e = p3.y - p0.y; f = p0.y;
    g = 0; h = 0;
  } else {
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) < 1e-10) {
      // Fallback for collinear/degenerate case
      a = p1.x - p0.x; b = p3.x - p0.x; c = p0.x;
      d = p1.y - p0.y; e = p3.y - p0.y; f = p0.y;
      g = 0; h = 0;
    } else {
      g = (sx * dy2 - dx2 * sy) / det;
      h = (dx1 * sy - sx * dy1) / det;
      a = p1.x - p0.x + g * p1.x;
      b = p3.x - p0.x + h * p3.x;
      c = p0.x;
      d = p1.y - p0.y + g * p1.y;
      e = p3.y - p0.y + h * p3.y;
      f = p0.y;
    }
  }

  // Pre-normalize coefficients with destination dimensions
  const aW = a / dstW, bH = b / dstH;
  const dW = d / dstW, eH = e / dstH;
  const gW = g / dstW, hH = h / dstH;

  const maxSrcX = srcW - 1;
  const maxSrcY = srcH - 1;

  let dstOffset = 0;

  for (let v = 0; v < dstH; v++) {
    const bHv_c = bH * v + c;
    const eHv_f = eH * v + f;
    const hHv_1 = hH * v + 1;

    for (let u = 0; u < dstW; u++) {
      const invW = 1.0 / (gW * u + hHv_1);
      const srcX = (aW * u + bHv_c) * invW;
      const srcY = (dW * u + eHv_f) * invW;

      // Clamp to source bounds
      const clampedX = srcX < 0 ? 0 : srcX > maxSrcX ? maxSrcX : srcX;
      const clampedY = srcY < 0 ? 0 : srcY > maxSrcY ? maxSrcY : srcY;

      // Bilinear interpolation
      const x0 = Math.floor(clampedX);
      const y0 = Math.floor(clampedY);
      const x1 = x0 < maxSrcX ? x0 + 1 : x0;
      const y1 = y0 < maxSrcY ? y0 + 1 : y0;

      const dx = clampedX - x0;
      const dy = clampedY - y0;
      const w00 = (1 - dx) * (1 - dy);
      const w10 = dx * (1 - dy);
      const w01 = (1 - dx) * dy;
      const w11 = dx * dy;

      const idx00 = (y0 * srcW + x0) << 2;
      const idx10 = (y0 * srcW + x1) << 2;
      const idx01 = (y1 * srcW + x0) << 2;
      const idx11 = (y1 * srcW + x1) << 2;

      dstPixels[dstOffset]     = (w00 * srcPixels[idx00]     + w10 * srcPixels[idx10]     + w01 * srcPixels[idx01]     + w11 * srcPixels[idx11]) | 0;
      dstPixels[dstOffset + 1] = (w00 * srcPixels[idx00 + 1] + w10 * srcPixels[idx10 + 1] + w01 * srcPixels[idx01 + 1] + w11 * srcPixels[idx11 + 1]) | 0;
      dstPixels[dstOffset + 2] = (w00 * srcPixels[idx00 + 2] + w10 * srcPixels[idx10 + 2] + w01 * srcPixels[idx01 + 2] + w11 * srcPixels[idx11 + 2]) | 0;
      dstPixels[dstOffset + 3] = 255;

      dstOffset += 4;
    }
  }

  return dstImg;
}
