import type { PaperTemplate } from '@/types/paper';
import type { TypographyConfig, HumanizerConfig, RealismConfig, HeaderConfig } from '@/types/style';
import type { PageLayout } from '@/types/canvas';
import { useHumanizer } from '@/composables/useHumanizer';

const imageCache = new Map<string, HTMLImageElement>();

export function useCanvasRenderer() {
  const { drawScribble } = useHumanizer();

  /**
   * Preload and cache an image
   */
  function loadImage(src: string): Promise<HTMLImageElement> {
    if (imageCache.has(src)) {
      return Promise.resolve(imageCache.get(src)!);
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  /**
   * Draw procedural HVS paper background if no image is used
   */
  function drawProceduralPaper(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle paper texture noise
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.015)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 200; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.random() * 4, ry + Math.random() * 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Render a complete page onto the target canvas
   */
  async function renderPage(
    canvas: HTMLCanvasElement,
    page: PageLayout,
    paper: PaperTemplate,
    typography: TypographyConfig,
    _humanizer: HumanizerConfig,
    realism: RealismConfig,
    header: HeaderConfig
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution matching paper native dimensions
    canvas.width = paper.width;
    canvas.height = paper.height;

    // 1. Draw Paper Background
    ctx.save();
    if (paper.imageUrl) {
      try {
        const bgImg = await loadImage(paper.imageUrl);
        ctx.drawImage(bgImg, 0, 0, paper.width, paper.height);
      } catch (e) {
        console.warn('Could not load paper background, falling back to procedural:', e);
        drawProceduralPaper(ctx, paper.width, paper.height);
      }
    } else {
      drawProceduralPaper(ctx, paper.width, paper.height);
    }
    ctx.restore();

    // 2. Draw Header Fields (with multiply blend)
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = typography.color;
    ctx.font = `${Math.round(typography.fontSize * 0.75)}px "${typography.fontFamily}", cursive, sans-serif`;
    ctx.textBaseline = 'alphabetic';

    if (paper.headerFields) {
      if (paper.headerFields.name && header.name) {
        ctx.fillText(header.name, paper.headerFields.name.x, paper.headerFields.name.y);
      }
      if (paper.headerFields.date && header.date) {
        ctx.fillText(header.date, paper.headerFields.date.x, paper.headerFields.date.y);
      }
      if (paper.headerFields.pageNumber && header.pageNumber) {
        const pNum = String(page.pageIndex + 1).padStart(2, '0');
        ctx.fillText(pNum, paper.headerFields.pageNumber.x, paper.headerFields.pageNumber.y);
      }
    }
    ctx.restore();

    // 3. Draw Text Lines with Realistic Multiply Blending
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const totalBaselineOffset = (typography.baselineOffset || 0) + (paper.baselineOffset || 0);

    for (const line of page.lines) {
      for (const word of line.words) {
        ctx.save();

        // 3a. Draw Highlight Behind Word
        if (word.isHighlight) {
          ctx.save();
          ctx.fillStyle = word.highlightColor || 'rgba(255, 235, 59, 0.45)';
          const hY = word.y + totalBaselineOffset - typography.fontSize * 0.85;
          const hHeight = typography.fontSize * 1.1;
          ctx.beginPath();
          ctx.roundRect(word.x - 4, hY, word.width + 8, hHeight, 4);
          ctx.fill();
          ctx.restore();
        }

        // 3b. Draw Word Text
        ctx.translate(word.x, word.y + totalBaselineOffset);
        ctx.rotate(word.rotation);
        ctx.globalAlpha = word.alpha;
        ctx.fillStyle = word.color;
        ctx.font = `${typography.fontSize}px "${typography.fontFamily}", cursive, sans-serif`;
        ctx.textBaseline = 'alphabetic';

        ctx.fillText(word.text, 0, 0);

        // 3c. Draw Strikethrough Scribble
        if (word.isStrikethrough) {
          drawScribble(
            ctx,
            0,
            0,
            word.width,
            typography.fontSize,
            word.color,
            word.wordIndex
          );
        }

        ctx.restore();
      }
    }
    ctx.restore();

    // 4. Environmental Post-Processing
    if (realism.enabled) {
      applyEnvironmentalEffects(ctx, paper.width, paper.height, realism);
    }
  }

  /**
   * Apply phone shadow, ambient lighting temperature, and vignette
   */
  function applyEnvironmentalEffects(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    realism: RealismConfig
  ) {
    ctx.save();

    // 4a. Ambient Lighting Temperature
    if (realism.lightingTemperature === 'warm_lamp' && realism.lightingWarmth > 0) {
      ctx.globalCompositeOperation = 'color-burn';
      const warmGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.4, width * 0.2,
        width * 0.5, height * 0.5, width * 0.85
      );
      warmGrad.addColorStop(0, `rgba(255, 235, 190, ${realism.lightingWarmth * 0.25})`);
      warmGrad.addColorStop(1, `rgba(180, 130, 70, ${realism.lightingWarmth * 0.4})`);
      ctx.fillStyle = warmGrad;
      ctx.fillRect(0, 0, width, height);
    } else if (realism.lightingTemperature === 'cool_daylight' && realism.lightingWarmth > 0) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = `rgba(180, 215, 255, ${realism.lightingWarmth * 0.3})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 4b. Smartphone / Body Shadow Overlay
    if (realism.shadowType === 'phone_top' && realism.shadowIntensity > 0) {
      ctx.globalCompositeOperation = 'multiply';
      const shadowGrad = ctx.createRadialGradient(
        width * 0.5, 0, width * 0.1,
        width * 0.5, height * 0.35, width * 0.7
      );
      shadowGrad.addColorStop(0, `rgba(15, 15, 25, ${realism.shadowIntensity * 0.45})`);
      shadowGrad.addColorStop(0.5, `rgba(25, 25, 35, ${realism.shadowIntensity * 0.25})`);
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, width, height * 0.75);
    } else if (realism.shadowType === 'phone_corner' && realism.shadowIntensity > 0) {
      ctx.globalCompositeOperation = 'multiply';
      const shadowGrad = ctx.createRadialGradient(
        width, 0, width * 0.1,
        width * 0.7, height * 0.4, width * 0.8
      );
      shadowGrad.addColorStop(0, `rgba(10, 10, 20, ${realism.shadowIntensity * 0.5})`);
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 4c. Edge Vignette
    if (realism.vignette > 0) {
      ctx.globalCompositeOperation = 'multiply';
      const vigGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.5, width * 0.4,
        width * 0.5, height * 0.5, width * 0.75
      );
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vigGrad.addColorStop(1, `rgba(0, 0, 0, ${realism.vignette * 0.35})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  return {
    loadImage,
    renderPage,
  };
}
