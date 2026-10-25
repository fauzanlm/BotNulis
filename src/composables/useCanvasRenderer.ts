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
   * Draw high-fidelity procedural paper backgrounds
   */
  function drawProceduralPaper(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    paper: PaperTemplate
  ) {
    ctx.save();

    if (paper.id === 'folio-bergaris-31') {
      // 1. Double Folio Bergaris (SiDU HD 31 Baris - 100% Vector Sharp)
      ctx.fillStyle = '#faf7ef';
      ctx.fillRect(0, 0, width, height);

      // Fine paper grain
      ctx.fillStyle = 'rgba(120, 90, 50, 0.015)';
      for (let i = 0; i < 500; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ctx.fillRect(rx, ry, Math.random() * 3, Math.random() * 3);
      }

      // Top printed header: No. and Date
      ctx.fillStyle = 'rgba(80, 95, 115, 0.65)';
      ctx.font = '600 36px "Courier New", monospace, sans-serif';
      ctx.fillText('No.  : .........................', width - 820, 310);
      ctx.fillText('Date : .........................', width - 820, 375);

      // Double top red/magenta header lines
      ctx.strokeStyle = 'rgba(215, 65, 65, 0.75)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(80, 420);
      ctx.lineTo(width - 80, 420);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(80, 428);
      ctx.lineTo(width - 80, 428);
      ctx.stroke();

      // Left vertical red margin rule
      ctx.strokeStyle = 'rgba(225, 65, 65, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(paper.marginLeft - 25, 100);
      ctx.lineTo(paper.marginLeft - 25, height - 100);
      ctx.stroke();

      // 31 Ruling Lines
      ctx.strokeStyle = 'rgba(88, 135, 195, 0.65)';
      ctx.lineWidth = 1.6;
      for (let y = paper.marginTop; y <= paper.marginBottom; y += paper.lineHeight) {
        ctx.beginPath();
        ctx.moveTo(paper.marginLeft - 25, y);
        ctx.lineTo(width - 120, y);
        ctx.stroke();
      }

      // Double bottom blue line
      ctx.beginPath();
      ctx.moveTo(paper.marginLeft - 25, paper.marginBottom + 6);
      ctx.lineTo(width - 120, paper.marginBottom + 6);
      ctx.stroke();

    } else if (paper.id === 'buku-sidu-25') {
      // 2. Buku Tulis Sekolah Sinar Dunia HD 25 Baris
      ctx.fillStyle = '#faf8f2';
      ctx.fillRect(0, 0, width, height);

      // Fine paper grain
      ctx.fillStyle = 'rgba(120, 90, 50, 0.015)';
      for (let i = 0; i < 500; i++) {
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ctx.fillRect(rx, ry, Math.random() * 3, Math.random() * 3);
      }

      // Top printed header: No. and Tanggal
      ctx.fillStyle = 'rgba(80, 95, 115, 0.65)';
      ctx.font = '600 36px "Courier New", monospace, sans-serif';
      ctx.fillText('No.     : ......................', width - 820, 320);
      ctx.fillText('Tanggal : ......................', width - 820, 390);

      // Left vertical red margin rule
      ctx.strokeStyle = 'rgba(225, 65, 65, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(paper.marginLeft - 25, 100);
      ctx.lineTo(paper.marginLeft - 25, height - 100);
      ctx.stroke();

      // 25 Ruling Lines
      ctx.strokeStyle = 'rgba(88, 135, 195, 0.65)';
      ctx.lineWidth = 1.6;
      for (let y = paper.marginTop; y <= paper.marginBottom; y += paper.lineHeight) {
        ctx.beginPath();
        ctx.moveTo(paper.marginLeft - 25, y);
        ctx.lineTo(width - 120, y);
        ctx.stroke();
      }

    } else if (paper.id === 'binder-loose-leaf-20') {
      // 1. Off-white binder sheet
      ctx.fillStyle = '#fcfbf7';
      ctx.fillRect(0, 0, width, height);

      // Ruling Lines
      ctx.strokeStyle = '#c6daf0';
      ctx.lineWidth = 1.2;
      for (let y = paper.marginTop; y <= paper.marginBottom; y += paper.lineHeight) {
        ctx.beginPath();
        ctx.moveTo(paper.marginLeft - 20, y);
        ctx.lineTo(paper.marginRight + 40, y);
        ctx.stroke();
      }

      // Vertical red margin rule
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(paper.marginLeft - 20, 80);
      ctx.lineTo(paper.marginLeft - 20, height - 80);
      ctx.stroke();

      // 20 Punch Holes on Left Margin
      const holeX = 90;
      const holeRadius = 14;
      const startHoleY = 160;
      const endHoleY = height - 160;
      const holeCount = 20;
      const holeStep = (endHoleY - startHoleY) / (holeCount - 1);

      for (let i = 0; i < holeCount; i++) {
        const hy = startHoleY + i * holeStep;
        // Inner shadow hole
        ctx.fillStyle = '#2b2b2b';
        ctx.beginPath();
        ctx.arc(holeX, hy, holeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Rim highlight
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    } else if (paper.id === 'yellow-legal-pad') {
      // Yellow Legal Pad
      ctx.fillStyle = '#fff6b8';
      ctx.fillRect(0, 0, width, height);

      // Horizontal blue lines
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 1.4;
      for (let y = paper.marginTop; y <= paper.marginBottom; y += paper.lineHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Double vertical red margin lines
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(paper.marginLeft - 20, 0);
      ctx.lineTo(paper.marginLeft - 20, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(paper.marginLeft - 14, 0);
      ctx.lineTo(paper.marginLeft - 14, height);
      ctx.stroke();

      // Top brown leather binding header
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, width, 100);

      // Gold staples
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(width * 0.25, 45, 60, 10);
      ctx.fillRect(width * 0.75, 45, 60, 10);
    } else if (paper.id === 'grid-math-paper') {
      // Grid Math Paper
      ctx.fillStyle = '#fafaf8';
      ctx.fillRect(0, 0, width, height);

      const gridSize = 30; // 30px grid boxes
      ctx.lineWidth = 0.8;
      for (let x = 60; x <= width - 60; x += gridSize) {
        ctx.strokeStyle = (x % (gridSize * 5) === 0) ? '#93c5fd' : '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, height - 60);
        ctx.stroke();
      }
      for (let y = 60; y <= height - 60; y += gridSize) {
        ctx.strokeStyle = (y % (gridSize * 5) === 0) ? '#93c5fd' : '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(width - 60, y);
        ctx.stroke();
      }
    } else if (paper.id === 'dot-grid-bullet') {
      // Dot Grid
      ctx.fillStyle = '#fcfbf9';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#94a3b8';
      const dotSpacing = 35;
      for (let x = 70; x < width - 70; x += dotSpacing) {
        for (let y = 70; y < height - 70; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (paper.id === 'vintage-parchment') {
      // Vintage Parchment
      ctx.fillStyle = '#f4e3c1';
      ctx.fillRect(0, 0, width, height);

      // Vignette burnt edges
      const radGrad = ctx.createRadialGradient(
        width * 0.5, height * 0.5, width * 0.35,
        width * 0.5, height * 0.5, width * 0.75
      );
      radGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      radGrad.addColorStop(1, 'rgba(120, 70, 20, 0.45)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft brown ruling lines
      ctx.strokeStyle = 'rgba(139, 94, 60, 0.35)';
      ctx.lineWidth = 1.2;
      for (let y = paper.marginTop; y <= paper.marginBottom; y += paper.lineHeight) {
        ctx.beginPath();
        ctx.moveTo(paper.marginLeft - 20, y);
        ctx.lineTo(paper.marginRight + 20, y);
        ctx.stroke();
      }
    } else if (paper.id === 'chalkboard-dark') {
      // Chalkboard dark slate
      ctx.fillStyle = '#1e242b';
      ctx.fillRect(0, 0, width, height);

      // Subtle chalk guide lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      for (let y = paper.marginTop; y <= paper.marginBottom; y += paper.lineHeight) {
        ctx.beginPath();
        ctx.moveTo(paper.marginLeft - 20, y);
        ctx.lineTo(paper.marginRight + 20, y);
        ctx.stroke();
      }
    } else {
      // Standard HVS
      ctx.fillStyle = '#faf8f5';
      ctx.fillRect(0, 0, width, height);
    }

    // Add subtle organic paper grain
    ctx.strokeStyle = paper.id === 'chalkboard-dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 250; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.random() * 6, ry + Math.random() * 6);
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
        drawProceduralPaper(ctx, paper.width, paper.height, paper);
      }
    } else {
      drawProceduralPaper(ctx, paper.width, paper.height, paper);
    }
    ctx.restore();

    const isDarkPaper = paper.id === 'chalkboard-dark';
    const effectiveInkColor = isDarkPaper
      ? (typography.color === '#1b263b' || typography.color === '#111827' ? '#f8fafc' : typography.color)
      : typography.color;
    const blendMode = isDarkPaper ? 'screen' : 'multiply';

    // 2. Draw Header Fields (with multiply/screen blend)
    ctx.save();
    ctx.globalCompositeOperation = blendMode;
    ctx.fillStyle = effectiveInkColor;
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

    // 3. Draw Text Lines with Realistic Multiply/Screen Blending
    ctx.save();
    ctx.globalCompositeOperation = blendMode;
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
        ctx.fillStyle = isDarkPaper && (word.color === '#1b263b' || word.color === '#111827') ? '#f8fafc' : word.color;
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
            ctx.fillStyle as string,
            word.wordIndex
          );
        }

        ctx.restore();
      }
    }
    ctx.restore();

    // 4. Environmental Post-Processing
    if (realism.enabled && !isDarkPaper) {
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
