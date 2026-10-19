<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePaperStore } from '@/stores/paperStore';
import type { PaperCategory } from '@/types/paper';
import { Check } from 'lucide-vue-next';

const paperStore = usePaperStore();
const selectedCategory = ref<string>('all');

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'notebook', label: 'Buku Tulis' },
  { key: 'folio', label: 'Double Folio' },
  { key: 'binder', label: 'Binder & Loose Leaf' },
  { key: 'specialty', label: 'Kertas Khusus' },
  { key: 'artistic', label: 'Artistik' },
];

const filteredPapers = computed(() => {
  if (selectedCategory.value === 'all') {
    return paperStore.allPapers;
  }
  return paperStore.allPapers.filter((p) => p.category === selectedCategory.value as PaperCategory);
});

function getCategoryColor(cat: PaperCategory) {
  switch (cat) {
    case 'notebook': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    case 'folio': return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300';
    case 'binder': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
    case 'specialty': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    case 'artistic': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
  }
}
</script>

<template>
  <div class="space-y-4 p-4">
    <!-- Header & Counter -->
    <div class="flex items-center justify-between">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Pilihan Template Kertas
      </label>
      <span class="text-[11px] text-slate-400 font-mono">{{ paperStore.allPapers.length }} template</span>
    </div>

    <!-- Category Filter Chips -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="cat in CATEGORIES"
        :key="cat.key"
        @click="selectedCategory = cat.key"
        :class="[
          'px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition border',
          selectedCategory === cat.key
            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300',
        ]"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Paper Cards List -->
    <div class="grid grid-cols-1 gap-2.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
      <button
        v-for="paper in filteredPapers"
        :key="paper.id"
        @click="paperStore.setPaper(paper.id)"
        :class="[
          'flex items-center justify-between p-3 rounded-xl border text-left transition relative overflow-hidden',
          paperStore.currentPaperId === paper.id
            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
        ]"
      >
        <div class="flex items-center gap-3">
          <!-- Thumbnail preview or stylized badge -->
          <div class="w-10 h-14 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner relative">
            <img
              v-if="paper.imageUrl"
              :src="paper.imageUrl"
              :alt="paper.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center text-[9px] font-mono font-bold p-1 text-center"
              :class="[
                paper.id === 'chalkboard-dark' ? 'bg-slate-900 text-white' :
                paper.id === 'yellow-legal-pad' ? 'bg-amber-100 text-amber-900' :
                paper.id === 'vintage-parchment' ? 'bg-amber-200 text-amber-950' :
                'bg-slate-50 text-slate-500'
              ]"
            >
              <span class="truncate">{{ paper.category.slice(0, 4).toUpperCase() }}</span>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-1.5 mb-0.5">
              <span
                class="text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize"
                :class="getCategoryColor(paper.category)"
              >
                {{ paper.category }}
              </span>
              <p class="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{{ paper.name }}</p>
            </div>
            <p class="text-[10px] text-slate-400">
              {{ paper.totalLines || 'N/A' }} baris • Spasi {{ paper.lineHeight }}px • {{ paper.width }}x{{ paper.height }}
            </p>
          </div>
        </div>

        <Check v-if="paperStore.currentPaperId === paper.id" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
      </button>
    </div>
  </div>
</template>
