export interface FontItem {
  id: string;
  name: string;
  family: string;
  url: string;
  category: 'neat' | 'casual' | 'messy' | 'aesthetic';
  recommendedScale: number; // default font size multiplier
}

export const FONT_PRESETS: FontItem[] = [
  {
    id: 'standard-1',
    name: 'Tulisan Tangan Rapi 1 (Default)',
    family: 'Font_Standard1',
    url: '/assets/fonts/Font_Standard1.ttf',
    category: 'neat',
    recommendedScale: 52,
  },
  {
    id: 'standard-2',
    name: 'Tulisan Tangan Rapi 2',
    family: 'Font_Standard2',
    url: '/assets/fonts/Font_Standard2.ttf',
    category: 'neat',
    recommendedScale: 52,
  },
  {
    id: 'standard-3',
    name: 'Tulisan Tangan Halus 3',
    family: 'Font_Standard3',
    url: '/assets/fonts/Font_Standard3.ttf',
    category: 'neat',
    recommendedScale: 54,
  },
  {
    id: 'ugly-handwriting',
    name: 'Cakar Ayam Cowok Santai',
    family: 'Ugly_Handwriting',
    url: '/assets/fonts/Ugly_Handwriting.otf',
    category: 'messy',
    recommendedScale: 58,
  },
  {
    id: 'childlike',
    name: 'Tulisan Natural Pelajar',
    family: 'Childlike',
    url: '/assets/fonts/Childlike.otf',
    category: 'casual',
    recommendedScale: 52,
  },
  {
    id: 'kid-playon',
    name: 'Tulisan Tangan Cepat',
    family: 'Kid_Playon',
    url: '/assets/fonts/Kid_Playon.ttf',
    category: 'casual',
    recommendedScale: 56,
  },
  {
    id: 'tom-hand',
    name: 'Tulisan Pulpen Tom',
    family: 'Tom_Hand',
    url: '/assets/fonts/Tom_Hand.ttf',
    category: 'casual',
    recommendedScale: 54,
  },
  {
    id: 'caveat',
    name: 'Caveat Aesthetic (Google)',
    family: 'Caveat',
    url: '/assets/fonts/Caveat.ttf',
    category: 'aesthetic',
    recommendedScale: 58,
  },
  {
    id: 'kalam',
    name: 'Kalam Spidol Tipis (Google)',
    family: 'Kalam',
    url: '/assets/fonts/Kalam.ttf',
    category: 'aesthetic',
    recommendedScale: 50,
  },
  {
    id: 'indie-flower',
    name: 'Indie Flower Cute (Google)',
    family: 'IndieFlower',
    url: '/assets/fonts/IndieFlower.ttf',
    category: 'aesthetic',
    recommendedScale: 52,
  },
];
