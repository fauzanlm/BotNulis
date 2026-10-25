import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useDebouncedRefHistory } from '@vueuse/core';
import type { HeaderConfig } from '@/types/style';

const DEFAULT_SAMPLE_TEXT = `Tugas Bahasa Indonesia & IPA
Nama: Budi Santoso
Kelas: XII MIPA 2

PENGARUH ENERGI TERBARUKAN BAGI MASA DEPAN
Energi terbarukan merupakan sumber energi yang berasal dari alam dan dapat pulih secara alami tanpa batas waktu. Berbeda dengan bahan bakar fosil seperti minyak bumi dan batu bara yang menimbulkan polusi udara serta pemanasan global.

Pemanfaatan panel surya di atap rumah dan pembangkit listrik tenaga bayu (angin) kini semakin berkembang pesat di berbagai daerah Indonesia. ~~Meskipun biaya awalnya cukup mahal~~, namun penghematan jangka panjangnya sangat nyata bagi lingkungan kita.

[merah]Catatan Penting Guru:[/merah]
1. Semua tugas harus ditulis tangan rapi pada kertas folio bergaris.
2. Jangan lupa sertakan rumus efisiensi panel surya: ==P = V x I==
3. Batas akhir pengumpulan hari Jumat pukul 14.00 WIB.

Demikian ringkasan tugas mandiri ini saya buat dengan sungguh-sungguh tanpa bantuan joki ketik. Semoga dapat memenuhi kriteria penilaian tugas semester ini.`;

export const useDocumentStore = defineStore(
  'document',
  () => {
    const text = ref(DEFAULT_SAMPLE_TEXT);
    const currentPageIndex = ref(0);
    const totalPages = ref(1);

    // Undo / Redo history tracking for text content
    const {
      undo: historyUndo,
      redo: historyRedo,
      canUndo,
      canRedo,
      commit,
    } = useDebouncedRefHistory(text, { capacity: 50, debounce: 300 });

    const header = ref<HeaderConfig>({
      name: 'Budi Santoso (XII MIPA 2)',
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      subject: 'Tugas Mandiri',
      pageNumber: '01',
    });

    function setPage(index: number) {
      if (index >= 0 && index < totalPages.value) {
        currentPageIndex.value = index;
      }
    }

    function resetToSample() {
      text.value = DEFAULT_SAMPLE_TEXT;
      commit();
      currentPageIndex.value = 0;
    }

    function undo() {
      if (canUndo.value) {
        historyUndo();
      }
    }

    function redo() {
      if (canRedo.value) {
        historyRedo();
      }
    }

    const isScannerOpen = ref(false);

    function openScanner() {
      isScannerOpen.value = true;
    }

    function closeScanner() {
      isScannerOpen.value = false;
    }

    return {
      text,
      currentPageIndex,
      totalPages,
      header,
      isScannerOpen,
      canUndo,
      canRedo,
      undo,
      redo,
      commit,
      setPage,
      resetToSample,
      openScanner,
      closeScanner,
    };
  },
  {
    persist: {
      pick: ['text', 'header', 'currentPageIndex'],
    },
  }
);
