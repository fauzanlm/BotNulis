import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PaperTemplate } from '@/types/paper';
import { PAPER_PRESETS } from '@/utils/paperPresets';

export const usePaperStore = defineStore(
  'paper',
  () => {
    const currentPaperId = ref<string>('buku-sidu-25');
    const customPapers = ref<PaperTemplate[]>([]);

    const allPapers = computed(() => {
      return [...PAPER_PRESETS, ...customPapers.value];
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

    return {
      currentPaperId,
      customPapers,
      allPapers,
      currentPaper,
      setPaper,
      addCustomPaper,
    };
  },
  {
    persist: true,
  }
);
