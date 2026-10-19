import { ref } from 'vue';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { PaperTemplate } from '@/types/paper';
import type { PageLayout } from '@/types/canvas';
import type { TypographyConfig, HumanizerConfig, RealismConfig, HeaderConfig } from '@/types/style';
import { useCanvasRenderer } from '@/composables/useCanvasRenderer';

export function useExporter() {
  const isExporting = ref(false);
  const exportProgress = ref(0);
  const { renderPage } = useCanvasRenderer();

  /**
   * Export current active canvas page directly as JPG or PNG
   */
  async function exportSingleImage(
    canvas: HTMLCanvasElement,
    format: 'jpg' | 'png' = 'jpg',
    filename = 'tugas_tulisan'
  ) {
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = format === 'png' ? '.png' : '.jpg';
    const quality = format === 'png' ? 1.0 : 0.92;

    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}${extension}`);
      }
    }, mimeType, quality);
  }

  /**
   * Copy current active page canvas to system clipboard
   */
  async function copyToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });

      if (!blob) return false;
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  }

  /**
   * Export all pages into a multi-page PDF document matching paper dimensions
   */
  async function exportAllToPDF(
    pages: PageLayout[],
    paper: PaperTemplate,
    typography: TypographyConfig,
    humanizer: HumanizerConfig,
    realism: RealismConfig,
    header: HeaderConfig,
    filename = 'tugas_lengkap'
  ) {
    if (pages.length === 0) return;

    isExporting.value = true;
    exportProgress.value = 0;

    try {
      const isLandscape = paper.width > paper.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [paper.width, paper.height],
        compress: true,
      });

      // Offscreen canvas for rendering each page at native resolution
      const offCanvas = document.createElement('canvas');

      for (let i = 0; i < pages.length; i++) {
        exportProgress.value = Math.round(((i + 1) / pages.length) * 100);
        await renderPage(offCanvas, pages[i], paper, typography, humanizer, realism, header);

        const imgData = offCanvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) {
          pdf.addPage([paper.width, paper.height], isLandscape ? 'landscape' : 'portrait');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, paper.width, paper.height, undefined, 'FAST');
      }

      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      throw err;
    } finally {
      isExporting.value = false;
      exportProgress.value = 0;
    }
  }

  /**
   * Export all pages into a single ZIP file containing JPEGs
   */
  async function exportAllToZip(
    pages: PageLayout[],
    paper: PaperTemplate,
    typography: TypographyConfig,
    humanizer: HumanizerConfig,
    realism: RealismConfig,
    header: HeaderConfig,
    filename = 'tugas_halaman_semua'
  ) {
    if (pages.length === 0) return;

    isExporting.value = true;
    exportProgress.value = 0;

    try {
      const zip = new JSZip();
      const folder = zip.folder(filename) || zip;
      const offCanvas = document.createElement('canvas');

      for (let i = 0; i < pages.length; i++) {
        exportProgress.value = Math.round(((i + 1) / pages.length) * 100);
        await renderPage(offCanvas, pages[i], paper, typography, humanizer, realism, header);

        const blob = await new Promise<Blob | null>((resolve) => {
          offCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92);
        });

        if (blob) {
          const pageStr = String(i + 1).padStart(2, '0');
          folder.file(`halaman_${pageStr}.jpg`, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${filename}.zip`);
    } catch (err) {
      console.error('Failed to export ZIP:', err);
      throw err;
    } finally {
      isExporting.value = false;
      exportProgress.value = 0;
    }
  }

  return {
    isExporting,
    exportProgress,
    exportSingleImage,
    copyToClipboard,
    exportAllToPDF,
    exportAllToZip,
  };
}
