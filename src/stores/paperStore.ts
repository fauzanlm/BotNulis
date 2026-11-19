import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PaperTemplate } from '@/types/paper';
import { PAPER_PRESETS } from '@/utils/paperPresets';

export const usePaperStore = defineStore(
  'paper',
  () => {
    const currentPaperId = ref<string>('folio-sidu-real');
    const customPapers = ref<PaperTemplate[]>([]);

    const allPapers = computed(() => {
      const presetIds = new Set(PAPER_PRESETS.map((p) => p.id));
      // Deduplicate in case user scanned 'Scan Kertas (09.44)' previously into localStorage
      const filteredCustom = customPapers.value.filter(
        (p) => !presetIds.has(p.id) && p.name !== 'Scan Kertas (09.44)'
      );
      return [...PAPER_PRESETS, ...filteredCustom];
    });

    const currentPaper = computed<PaperTemplate>(() => {
      const found = allPapers.value.find((p) => p.id === currentPaperId.value);
      return found || PAPER_PRESETS[0];
    });

    function setPaper(id: string) {
      if (allPapers.value.some((p) => p.id === id)) {
        currentPaperId.value = id;
      }
    }

    function addCustomPaper(paper: PaperTemplate) {
      customPapers.value.push(paper);
      currentPaperId.value = paper.id;
    }

    function removeCustomPaper(id: string) {
      customPapers.value = customPapers.value.filter((p) => p.id !== id);
      if (currentPaperId.value === id) {
        currentPaperId.value = PAPER_PRESETS[0].id;
      }
    }

    return {
      currentPaperId,
      customPapers,
      allPapers,
      currentPaper,
      setPaper,
      addCustomPaper,
      removeCustomPaper,
    };
  },
  {
    persist: true,
  }
);
