import type { PaperTemplate } from '@/types/paper';

export const PAPER_PRESETS: PaperTemplate[] = [
  {
    id: 'folio-sidu-real',
    name: 'Double Folio SiDU Real (Foto Asli HD 38 Baris)',
    category: 'folio',
    imageUrl: '/assets/papers/folio_sidu_real_hd.png',
    width: 2048,
    height: 3056,
    marginTop: 304,
    marginBottom: 2776,
    marginLeft: 160,
    marginRight: 1888,
    lineHeight: 67,
    baselineOffset: -6,
    totalLines: 38,
    headerFields: {
      name: { x: 160, y: 140, label: 'Nama / NIM' },
      date: { x: 1500, y: 140, label: 'Tanggal' },
    },
  },
  {
    id: 'scan-kertas-0944',
    name: 'Scan Kertas (09.44)',
    category: 'folio',
    imageUrl: '/assets/papers/sidu_pad_folio_hd.png',
    width: 1920,
    height: 3017,
    marginTop: 360,
    marginBottom: 2715,
    marginLeft: 172,
    marginRight: 1748,
    lineHeight: 65,
    baselineOffset: -6,
    totalLines: 28,
    headerFields: {
      name: { x: 172, y: 180, label: 'Nama / NIM' },
      date: { x: 1400, y: 180, label: 'Tanggal' },
      pageNumber: { x: 1650, y: 180, label: 'No' },
    },
  },
];
