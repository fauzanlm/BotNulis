export interface FontItem {
  id: string;
  name: string;
  family: string;
  url: string;
  category: 'neat' | 'casual' | 'messy' | 'aesthetic' | 'cursive';
  recommendedScale: number; // default font size multiplier
  description?: string;
  previewText?: string;
}

export const FONT_PRESETS: FontItem[] = [
  // --- Kategori: SANGAT RAPIH ---
  {
    id: 'patrick-hand',
    name: 'Patrick Hand (Sangat Rapi & Bersih)',
    family: 'PatrickHand',
    url: '/assets/fonts/PatrickHand.ttf',
    category: 'neat',
    recommendedScale: 52,
    description: 'Tulisan cetak super rapi ala siswa rajin, sangat mudah dibaca.',
    previewText: 'Tugas Bab 3: Ringkasan Materi & Latihan',
  },
  {
    id: 'mali-notes',
    name: 'Mali Aesthetic (Rapi Bulat)',
    family: 'Mali',
    url: '/assets/fonts/Mali.ttf',
    category: 'neat',
    recommendedScale: 50,
    description: 'Tulisan rapi membulat ala catatan aesthetic studygram / bullet journal.',
    previewText: 'Catatan Kuliah Rapi & Terstruktur',
  },
  {
    id: 'architects-daughter',
    name: 'Architects Lettering (Rapi Presisi)',
    family: 'ArchitectsDaughter',
    url: '/assets/fonts/ArchitectsDaughter.ttf',
    category: 'neat',
    recommendedScale: 48,
    description: 'Huruf tegak arsitektur dengan garis lurus presisi dan tegas.',
    previewText: 'LAPORAN PRAKTIKUM FISIKA DASAR',
  },
  {
    id: 'itim-neat',
    name: 'Itim Note (Rapi Halus)',
    family: 'Itim',
    url: '/assets/fonts/Itim.ttf',
    category: 'neat',
    recommendedScale: 50,
    description: 'Tulisan tangan rapi dengan sudut lembut, nyaman dilihat.',
    previewText: 'Jawaban Soal Ujian Tengah Semester',
  },
  {
    id: 'delius-school',
    name: 'Delius Pelajar Rajin',
    family: 'Delius',
    url: '/assets/fonts/Delius.ttf',
    category: 'neat',
    recommendedScale: 52,
    description: 'Huruf tegak ala buku tulis sekolah, sangat formal dan tertata.',
    previewText: 'Penyelesaian Persamaan Diferensial',
  },
  {
    id: 'standard-1',
    name: 'Tulisan Tangan Rapi 1 (Klasik)',
    family: 'Font_Standard1',
    url: '/assets/fonts/Font_Standard1.ttf',
    category: 'neat',
    recommendedScale: 52,
    description: 'Font klasik Bot Nulis versi pertama, rapi dan natural.',
    previewText: 'Laporan Tugas Akhir Semester Genap',
  },
  {
    id: 'standard-2',
    name: 'Tulisan Tangan Rapi 2',
    family: 'Font_Standard2',
    url: '/assets/fonts/Font_Standard2.ttf',
    category: 'neat',
    recommendedScale: 52,
    description: 'Variasi tulisan tangan rapi dengan spasi seimbang.',
    previewText: 'Resume Hasil Diskusi Kelompok',
  },
  {
    id: 'standard-3',
    name: 'Tulisan Tangan Halus 3',
    family: 'Font_Standard3',
    url: '/assets/fonts/Font_Standard3.ttf',
    category: 'neat',
    recommendedScale: 54,
    description: 'Gaya tulisan pena tipis dan rapi.',
    previewText: 'Analisis Data dan Pembahasan',
  },

  // --- Kategori: TEGAK BERSAMBUNG / KURSIF ---
  {
    id: 'marck-script',
    name: 'Marck Script (Tegak Sambung Rapi)',
    family: 'MarckScript',
    url: '/assets/fonts/MarckScript.ttf',
    category: 'cursive',
    recommendedScale: 54,
    description: 'Tulisan tegak bersambung yang sangat rapi dan elegan.',
    previewText: 'Tegak Bersambung Indah dan Rapi',
  },
  {
    id: 'bad-script',
    name: 'Bad Script (Kursif Pulpen Natural)',
    family: 'BadScript',
    url: '/assets/fonts/BadScript.ttf',
    category: 'cursive',
    recommendedScale: 52,
    description: 'Tulisan sambung pulpen gel asli yang mengalir rapi.',
    previewText: 'Catatan Jurnal Praktikum Biologi',
  },

  // --- Kategori: ESTETIK & POPULER ---
  {
    id: 'caveat',
    name: 'Caveat Aesthetic',
    family: 'Caveat',
    url: '/assets/fonts/Caveat.ttf',
    category: 'aesthetic',
    recommendedScale: 58,
    description: 'Tulisan santai modern populer di Instagram dan Pinterest.',
    previewText: 'Rangkuman Materi Ujian Mandiri',
  },
  {
    id: 'kalam',
    name: 'Kalam Spidol Tipis',
    family: 'Kalam',
    url: '/assets/fonts/Kalam.ttf',
    category: 'aesthetic',
    recommendedScale: 50,
    description: 'Goresan spidol tipis berkarakter natural.',
    previewText: 'Mindmap & Pembahasan Soal Tryout',
  },
  {
    id: 'indie-flower',
    name: 'Indie Flower Cute',
    family: 'IndieFlower',
    url: '/assets/fonts/IndieFlower.ttf',
    category: 'aesthetic',
    recommendedScale: 52,
    description: 'Tulisan cute dengan proporsi huruf unik.',
    previewText: 'Daily Study Notes & Checklist',
  },

  // --- Kategori: NATURAL & CASUAL ---
  {
    id: 'childlike',
    name: 'Tulisan Natural Pelajar',
    family: 'Childlike',
    url: '/assets/fonts/Childlike.otf',
    category: 'casual',
    recommendedScale: 52,
    description: 'Tulisan tangan anak sekolah sehari-hari.',
    previewText: 'Latihan Soal Matematika Halaman 45',
  },
  {
    id: 'kid-playon',
    name: 'Tulisan Tangan Cepat',
    family: 'Kid_Playon',
    url: '/assets/fonts/Kid_Playon.ttf',
    category: 'casual',
    recommendedScale: 56,
    description: 'Tulisan saat buru-buru menyalin materi papan tulis.',
    previewText: 'Catatan Cepat Kuliah Umum',
  },
  {
    id: 'tom-hand',
    name: 'Tulisan Pulpen Tom',
    family: 'Tom_Hand',
    url: '/assets/fonts/Tom_Hand.ttf',
    category: 'casual',
    recommendedScale: 54,
    description: 'Gaya pulpen biasa dengan tekanan mantap.',
    previewText: 'Draft Pengantar Tugas Makalah',
  },

  // --- Kategori: CAKAR AYAM ---
  {
    id: 'ugly-handwriting',
    name: 'Cakar Ayam Cowok Santai',
    family: 'Ugly_Handwriting',
    url: '/assets/fonts/Ugly_Handwriting.otf',
    category: 'messy',
    recommendedScale: 58,
    description: 'Tulisan khas cowok sedikit acak-acakan tapi otentik.',
    previewText: 'Catatan ringkas gak sempat dirapiin',
  },
];
