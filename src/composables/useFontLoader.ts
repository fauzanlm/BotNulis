import { ref } from 'vue';

const loadedFonts = new Set<string>();

export function useFontLoader() {
  const isLoading = ref(false);
  const loadingError = ref<string | null>(null);

  /**
   * Load a font from a URL into document.fonts
   */
  async function loadFont(family: string, url: string): Promise<boolean> {
    if (loadedFonts.has(family)) {
      return true;
    }

    isLoading.value = true;
    loadingError.value = null;

    try {
      const font = new FontFace(family, `url(${url})`);
      const loaded = await font.load();
      document.fonts.add(loaded);
      loadedFonts.add(family);
      return true;
    } catch (err: any) {
      console.error(`Failed to load font ${family}:`, err);
      loadingError.value = err?.message || 'Failed to load font';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Load custom font from File object (user upload)
   */
  async function loadCustomFontFile(file: File): Promise<{ family: string; name: string } | null> {
    isLoading.value = true;
    loadingError.value = null;

    try {
      const buffer = await file.arrayBuffer();
      // Generate clean unique family name
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const familyName = `Custom_${cleanName}_${Date.now()}`;

      const font = new FontFace(familyName, buffer);
      const loaded = await font.load();
      document.fonts.add(loaded);
      loadedFonts.add(familyName);

      return {
        family: familyName,
        name: file.name.replace(/\.[^/.]+$/, ''),
      };
    } catch (err: any) {
      console.error('Failed to load custom font file:', err);
      loadingError.value = err?.message || 'Gagal memuat file font';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    loadingError,
    loadFont,
    loadCustomFontFile,
    loadedFonts,
  };
}
