import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDocumentStore } from '@/stores/documentStore';

describe('Document Store Undo / Redo', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default text', () => {
    const store = useDocumentStore();
    expect(store.text).toContain('Tugas Bahasa Indonesia');
  });

  it('should support undo and redo on text edits', async () => {
    const store = useDocumentStore();
    const initialText = store.text;

    // Change text and commit snapshot
    store.text = 'Kalimat pertama tugas';
    store.commit();

    expect(store.canUndo).toBe(true);

    // Undo change
    store.undo();
    expect(store.text).toBe(initialText);
    expect(store.canRedo).toBe(true);

    // Redo change
    store.redo();
    expect(store.text).toBe('Kalimat pertama tugas');
  });
});
