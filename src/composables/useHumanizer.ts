import { createPRNG } from '@/utils/prng';
import type { HumanizerConfig } from '@/types/style';

export function useHumanizer() {
  /**
   * Calculate deterministic jitter and noise parameters for a specific word.
   * Scales proportionally with font size so jitter is clearly visible on high-resolution paper scans.
   */
  function getWordJitter(
    pageIndex: number,
    lineIndex: number,
    wordIndex: number,
    config: HumanizerConfig,
    fontSize = 52
  ) {
    if (!config.enabled) {
      return {
        jitterY: 0,
        rotation: 0,
        spacingFactor: 1,
        alpha: 1,
      };
    }

    const seed = (pageIndex * 100000) + (lineIndex * 1000) + (wordIndex * 17) + 12345;
    const prng = createPRNG(seed);

    // Baseline jitter: proportional to font size (up to ±30% of font size at 100% slider)
    const maxJitter = (fontSize * 0.3) * config.baselineJitter;
    const jitterY = (prng() - 0.5) * 2 * maxJitter;

    // Sub-degree to degree rotation (up to ±4.5deg in radians at 100% slider)
    const maxRotation = (9.0 * Math.PI / 180) * config.rotationJitter;
    const rotation = (prng() - 0.5) * 2 * maxRotation;

    // Spacing factor (ranges from 0.55x to 1.45x at 100% slider)
    const spacingFactor = 1 + (prng() - 0.5) * 0.9 * config.spacingJitter;

    // Ink flow / pressure variance (alpha between 0.72 and 1.0 at 100% slider)
    const alpha = 1 - (prng() * 0.28 * config.inkPressureVariance);

    return {
      jitterY,
      rotation,
      spacingFactor,
      alpha,
    };
  }

  /**
   * Calculate organic margin drift (hand fatigue drifting as lines descend).
   * Noticeable shift (up to 40px) on high-res paper templates.
   */
  function getLineMarginDrift(lineIndex: number, config: HumanizerConfig): number {
    if (!config.enabled || config.marginDrift <= 0) return 0;
    // Gentle sinusoidal wave combined with slight progressive drift
    const wave = Math.sin(lineIndex * 0.3) * 24;
    const slope = (lineIndex % 20) * 1.8;
    return (wave + slope) * config.marginDrift;
  }

  /**
   * Draw authentic procedural scribble for strikethrough words
   */
  function drawScribble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    fontSize: number,
    color: string,
    seed: number
  ) {
    const prng = createPRNG(seed);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.8, fontSize * 0.04) + prng() * 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const middleY = y - fontSize * 0.28;
    const passes = 2;

    for (let p = 0; p < passes; p++) {
      ctx.beginPath();
      let curX = x - 4;
      let curY = middleY + (prng() - 0.5) * (fontSize * 0.15) + (p * 2);
      ctx.moveTo(curX, curY);

      while (curX < x + width + 4) {
        curX += 8 + prng() * 10;
        curY = middleY + (prng() - 0.5) * (fontSize * 0.2) + (p * 2);
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  return {
    getWordJitter,
    getLineMarginDrift,
    drawScribble,
  };
}
