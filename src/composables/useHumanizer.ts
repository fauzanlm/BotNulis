import { createPRNG } from '@/utils/prng';
import type { HumanizerConfig } from '@/types/style';

export function useHumanizer() {
  /**
   * Calculate deterministic jitter and noise parameters for a specific word
   */
  function getWordJitter(
    pageIndex: number,
    lineIndex: number,
    wordIndex: number,
    config: HumanizerConfig
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

    // Baseline jitter (-2px to +2px scaled by intensity)
    const jitterY = (prng() - 0.5) * 4 * config.baselineJitter;

    // Sub-degree rotation (-1.2deg to +1.2deg in radians)
    const rotation = (prng() - 0.5) * (2.4 * Math.PI / 180) * config.rotationJitter;

    // Spacing factor (0.85 to 1.15)
    const spacingFactor = 1 + (prng() - 0.5) * 0.3 * config.spacingJitter;

    // Ink flow / pressure variance (alpha between 0.88 and 1.0)
    const alpha = 1 - (prng() * 0.12 * config.inkPressureVariance);

    return {
      jitterY,
      rotation,
      spacingFactor,
      alpha,
    };
  }

  /**
   * Calculate organic margin drift (hand fatigue drifting as lines descend)
   */
  function getLineMarginDrift(lineIndex: number, config: HumanizerConfig): number {
    if (!config.enabled || config.marginDrift <= 0) return 0;
    // Gentle sinusoidal wave combined with slight progressive drift
    const wave = Math.sin(lineIndex * 0.35) * 6;
    const slope = (lineIndex % 15) * 0.4;
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
    ctx.lineWidth = 1.6 + prng() * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const middleY = y - fontSize * 0.28;
    const passes = 2;

    for (let p = 0; p < passes; p++) {
      ctx.beginPath();
      let curX = x - 3;
      let curY = middleY + (prng() - 0.5) * 4 + (p * 2);
      ctx.moveTo(curX, curY);

      while (curX < x + width + 4) {
        curX += 6 + prng() * 8;
        curY = middleY + (prng() - 0.5) * 8 + (p * 2);
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
