<script setup lang="ts">
import { ref } from 'vue';
import { useDocumentStore } from '@/stores/documentStore';
import { RotateCcw, Strikethrough, Highlighter, Palette, Undo2, Redo2 } from 'lucide-vue-next';

const documentStore = useDocumentStore();
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function insertTag(openTag: string, closeTag: string) {
  if (!textareaRef.value) return;
  const textarea = textareaRef.value;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = documentStore.text;
  const selected = text.substring(start, end) || 'teks';

  documentStore.text = text.substring(0, start) + openTag + selected + closeTag + text.substring(end);
  documentStore.commit();

  // Restore selection
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
  }, 10);
}

function handleKeydown(event: KeyboardEvent) {
  // Support Ctrl+Z / Cmd+Z (Undo) and Ctrl+Y / Cmd+Shift+Z (Redo)
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) {
      documentStore.redo();
    } else {
      documentStore.undo();
    }
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    documentStore.redo();
  }
}
</script>

<template>
  <div class="space-y-5 p-4">
    <!-- Header Section (Accordion / Card) -->
    <div class="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Header Kertas (Nama & Tanggal)
      </h3>

      <div class="grid grid-cols-2 gap-2.5">
        <div>
          <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Nama / Info</label>
          <input
            v-model="documentStore.header.name"
            type="text"
            placeholder="Nama Lengkap..."
            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
          <input
            v-model="documentStore.header.date"
            type="text"
            placeholder="DD/MM/YYYY"
            class="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Quick Formatting & History Bar -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Isi Tulisan Tangan
        </label>

        <!-- Undo, Redo, and Reset -->
        <div class="flex items-center gap-1.5">
          <button
            @click="documentStore.undo"
            :disabled="!documentStore.canUndo"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Undo (Ctrl+Z / Cmd+Z)"
          >
            <Undo2 class="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>

          <button
            @click="documentStore.redo"
            :disabled="!documentStore.canRedo"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Redo (Ctrl+Y / Cmd+Shift+Z)"
          >
            <Redo2 class="w-3.5 h-3.5" />
            <span>Redo</span>
          </button>

          <button
            @click="documentStore.resetToSample"
            class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            title="Reset ke contoh teks bawaan"
          >
            <RotateCcw class="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <!-- Quick Syntax Buttons -->
      <div class="flex flex-wrap items-center gap-1.5 pb-1">
        <button
          @click="insertTag('~~', '~~')"
          class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          title="Coretan kata pulpen alami"
        >
          <Strikethrough class="w-3 h-3 text-rose-500" />
          <span>~~Coret~~</span>
        </button>

        <button
          @click="insertTag('[merah]', '[/merah]')"
          class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100/50 text-red-700 dark:text-red-300 transition"
          title="Tinta Pulpen Merah"
        >
          <Palette class="w-3 h-3 text-red-600" />
          <span>[merah]</span>
        </button>

        <button
          @click="insertTag('[biru]', '[/biru]')"
          class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/50 text-blue-700 dark:text-blue-300 transition"
          title="Tinta Pulpen Biru"
        >
          <Palette class="w-3 h-3 text-blue-600" />
          <span>[biru]</span>
        </button>

        <button
          @click="insertTag('==', '==')"
          class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/50 text-amber-700 dark:text-amber-300 transition"
          title="Stabilo Kuning"
        >
          <Highlighter class="w-3 h-3 text-amber-500" />
          <span>==Stabilo==</span>
        </button>
      </div>

      <!-- Main Textarea -->
      <textarea
        ref="textareaRef"
        v-model="documentStore.text"
        rows="16"
        placeholder="Ketik atau tempel teks tugasmu di sini..."
        class="w-full text-xs font-mono leading-relaxed p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm"
        @keydown="handleKeydown"
      ></textarea>

      <!-- Stats Bar -->
      <div class="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>{{ documentStore.text.length }} karakter</span>
        <span>{{ documentStore.text.split(/\s+/).filter(Boolean).length }} kata</span>
      </div>
    </div>
  </div>
</template>
