# ✍️ Bot Nulis Studio

<p align="center">
  <img src="public/icon.svg" alt="Bot Nulis Studio Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>A modern, zero-server handwriting synthesis studio built with Vue 3, TypeScript, and HTML5 Canvas.</strong><br>
  Transform digital text into photorealistic, naturally varied handwritten notebook pages with 100% client-side privacy.
</p>

<p align="center">
  <a href="https://bot-nulis.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-bot--nulis.vercel.app-2563EB?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-F59E0B.svg?style=for-the-badge" alt="License MIT" /></a>
</p>

---

## 🌟 Overview

**Bot Nulis Studio** is an open-source, client-side handwriting synthesis engine designed to solve the limitations of first-generation "Bot Nulis" scripts (Python Pillow, P5.js, and server-side renderers). 

Traditional bot nulis tools suffer from server latency, severe queuing bottlenecks, rigid mathematical alignment, and artificial visual aesthetics. **Bot Nulis Studio** runs entirely within the user's browser, utilizing a seeded **Mulberry32 PRNG (Pseudo-Random Number Generator)** and native **HTML5 Canvas 2D API** to deliver fluid, natural handwriting with authentic human imperfections.

### 🚀 Try It Online
👉 **Live Application:** [https://bot-nulis.vercel.app](https://bot-nulis.vercel.app)

---

## ✨ Key Features

### 🧠 1. Deterministic Mulberry32 Humanizer Engine
- **Zero "Jumping" Text:** Traditional random jitter changes on every keystroke, causing words to dance. Bot Nulis uses a deterministic Mulberry32 PRNG seeded by word coordinates and paragraph indices, ensuring persistent and stable jitter during editing.
- **Micro-Jitter & Sub-Degree Rotation:** Calculates organic baseline shifts ($\pm 1.8\text{px}$) and subtle tilt rotations ($\pm 1.2^\circ$) per word.
- **Hand Fatigue Margin Drift:** Simulates human writing behavior where margins subtly wander as the hand fatigues down the page.
- **Ink Pressure Variance:** Procedurally adjusts ink opacity and stroke density across sentences to emulate natural pen pressure.
- **Realistic Pen Strikethrough:** Converts `~~typos~~` into multi-pass organic scribbles instead of sterile digital lines.

### 📝 2. Authentic Paper Templates & Procedural Vector Notebooks
- **Indonesian School Paper Standards:**
  - *Double Folio SiDU Ungu* (38 Baris HD Scan & Precision Ruling)
  - *Double Folio SiDU Real* (Photographic High-Res Scan)
  - *Double Folio Bergaris 31 Baris* (100% Vector Procedural Geometry)
  - *Buku Tulis Sinar Dunia 25 Baris* (Sekolah HD)
  - *Loose Leaf Binder A5* (20-Hole Punch Ring Simulation)
  - *Buku Big Boss Campus B5* & *Buku Tulis Biasa*
- **Alternative Textures:** Yellow Legal Pad, Grid Math Paper (Buku Kotak-kotak), Dot Grid Bullet Journal, Vintage Parchment, Chalkboard Slate, and Blank A4 HVS.
- **Custom Paper Upload:** Import any personal notebook scan and map custom ruling margins.

### 🖋️ 3. Curated Handwriting Typographies & Custom Fonts
- **17+ Built-in Font Presets:** Spanning neat school cursive, casual notes, studygram bullet journaling, and authentic messy handwriting:
  - *Neat:* Patrick Hand, Mali Aesthetic, Architects Lettering, Itim Note, Delius Pelajar Rajin, Standard 1-3.
  - *Cursive / Tegak Bersambung:* Marck Script, Caveat, Bad Script.
  - *Casual & Messy:* Indie Flower, Kalam, Ugly Handwriting, Childlike, Kid Playon, Tom Hand.
- **Custom Font Loader:** Drag & drop external `.ttf`, `.otf`, `.woff`, or `.woff2` files directly into the editor with instant local font face registration.

### 🎨 4. Rich Text Formatting & In-line Ink Styling
Write with intuitive markdown-like tags:
- `~~scribble~~` → Draws an authentic dual-pass pen scratch-out.
- `==highlight==` → Highlights keywords with a soft translucent highlighter wash.
- `[red]Text[/red]` or `[merah]Teks[/merah]` → Switches ink to red.
- `[blue]Text[/blue]` or `[biru]Teks[/biru]` → Switches ink to royal blue.
- `[color:#10b981]Custom Hex[/color]` → Custom ink palette support.

### 📸 5. Environmental Realism & Camera Shading
- **Multiply & Screen Composite Blending:** Renders ink using Canvas `globalCompositeOperation = 'multiply'` so paper fibers and lines show naturally through pen strokes.
- **Smartphone Camera Shadow:** Overlays realistic overhead or corner mobile phone shadows to emulate actual homework photos.
- **Ambient Lighting Temperature:** Warm incandescent desk lamp or cool natural daylight lighting gradients.
- **Vignette & Paper Grain:** Subtle lens roll-off and organic surface texture.

### 📄 6. Multi-Page Lookahead Pagination & Multi-Format Export
- **Continuous Overflow Pagination:** Text automatically flows into page 2, 3, and beyond based on line height and paper boundaries.
- **Export Options:**
  - 📕 **Multi-Page PDF:** High-resolution vector-scaled PDF document generated via `jsPDF`.
  - 📦 **Bulk ZIP Archive:** Downloads all rendered pages as individual high-res PNG/JPG files via `JSZip`.
  - 🖼️ **Single Image Export:** Instant PNG/JPG download of the active page.
  - 📋 **Copy to Clipboard:** One-click copy directly into the system clipboard for immediate pasting into chat or assignments.

### 📷 7. Built-in Document Scanner Studio
- Live webcam/camera capture with flashlight (torch) toggle.
- 4-point corner pin perspective warping (geometry rectification).
- Scanner enhancement filters: Magic Color (CamScanner style), Bradley Adaptive Threshold B&W, and Grayscale Sharpen.
- Use captured scans directly as active custom paper templates!

### 🔒 8. 100% Client-Side Privacy (Zero Server Overhead)
- No text or images are ever transmitted to any external backend.
- Works fully offline as an installable **Progressive Web App (PWA)**.
- Local drafts, undo/redo states, and custom preferences persist securely via `Pinia` and `localStorage`.

---

## 🏗️ Architecture & Render Pipeline

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|   Markdown / Text Input   |   Typography & Sliders   |   Paper Preset Selector    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             CORE COMPOSITION & STORES                             |
|       useRichTokenizer       |     documentStore     |        paperStore          |
|  (Extracts words, strikes,   |   (Undo/Redo history, |   (Ruling geometry, line   |
|     colors, highlights)      |     header fields)    |      height, margins)      |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                               PAGINATION SUBSYSTEM                                |
|                                 usePagination                                     |
|           - Measure token widths with measureText()                               |
|           - Compute organic margin drift per line                                 |
|           - Segment lines across multiple PageLayout instances                    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           CANVAS 2D RENDERING PIPELINE                            |
|                               useCanvasRenderer                                   |
|                                                                                   |
|   1. Draw Background: Scanned asset or procedural paper ruling                    |
|   2. Draw Header: Name, Date, Page Number at defined anchor positions             |
|   3. Set Composite: globalCompositeOperation = 'multiply'                         |
|   4. Iterate Words: Apply Mulberry32 PRNG (jitterY, rotation, spacing, alpha)     |
|   5. Procedural Scribbles: Render multi-pass strikethrough paths                  |
|   6. Post-Processing: Phone shadow overlays, warm/cool lighting, edge vignette    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 EXPORT ENGINE                                     |
|                                  useExporter                                      |
|          Multi-page PDF  |  ZIP Bundle (PNG/JPG)  |  System Clipboard             |
+-----------------------------------------------------------------------------------+
```

### Mulberry32 Deterministic PRNG Implementation
```typescript
export function createPRNG(seed: number): () => number {
  let s = seed >>> 0;
  return function (): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```
Each word's seed is calculated via `(pageIndex * 100000) + (lineIndex * 1000) + (wordIndex * 17) + 12345`. This guarantees deterministic rendering: typing a new letter on line 10 will **not** alter the jitter or placement of words on line 1.

---

## 💻 Tech Stack

| Technology | Purpose |
|---|---|
| **Vue 3 (Composition API)** | Reactive UI and high-performance canvas state orchestration |
| **TypeScript 5.7** | Strict type safety for canvas coordinate spaces, token streams, and presets |
| **Vite 6** | Ultra-fast build tool and developer experience |
| **Tailwind CSS 3.4** | Modern responsive interface and controls styling |
| **HTML5 Canvas 2D** | Native graphics pipeline with hardware-accelerated drawing |
| **Pinia & Persistedstate** | Reactive store management and local storage persistence |
| **jsPDF & JSZip** | Client-side multi-page PDF synthesis and ZIP archiving |
| **Vite PWA** | Offline service worker caching and installable web application |
| **Vitest** | Automated unit test suite for typography, PRNG, and geometry |

---

## 📂 Project Structure

```
BotNulis/
├── public/
│   ├── assets/
│   │   ├── fonts/           # Curated handwriting font binaries (.ttf, .otf)
│   │   └── papers/          # High-resolution paper textures & scans
│   └── icon.svg             # Application brand icon
├── src/
│   ├── assets/              # Global styles and Tailwind directives
│   ├── components/
│   │   ├── editor/          # Text editor, typography controls, and design tabs
│   │   ├── preview/         # Canvas viewport, pagination bar, and zoom controls
│   │   └── scanner/         # Document camera, perspective crop, and filter modal
│   ├── composables/
│   │   ├── useCanvasRenderer.ts   # Core Canvas 2D drawing pipeline
│   │   ├── useDocumentCamera.ts   # WebRTC video capture and torch controls
│   │   ├── useExporter.ts         # PDF, ZIP, and Clipboard export methods
│   │   ├── useFontLoader.ts       # Dynamic font registration & custom font upload
│   │   ├── useHumanizer.ts        # PRNG jitter, tilt, and procedural scribble algorithms
│   │   ├── usePagination.ts       # Lookahead multi-page word-wrapping engine
│   │   └── useRichTokenizer.ts    # Markdown and color tag parser
│   ├── stores/              # Pinia state stores (document, paper, style)
│   ├── types/               # TypeScript declarations (canvas, paper, style)
│   ├── utils/               # Math, geometry, PRNG, and scanner filter utilities
│   ├── App.vue              # Root application layout
│   └── main.ts              # Vue entrypoint
├── tests/
│   └── unit/                # Unit test suites (PRNG, tokenizer, pagination, scanner)
├── plan.md                  # Comprehensive architectural blueprint
├── package.json             # NPM dependencies and scripts
├── tailwind.config.js       # Tailwind CSS design system configuration
├── vite.config.ts           # Vite bundler & PWA plugin settings
└── vercel.json              # Vercel deployment routing configuration
```

---

## 🛠️ Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/fauzanlm/BotNulis.git
   cd BotNulis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. Run unit tests:
   ```bash
   npm test
   ```

5. Build for production:
   ```bash
   npm run build
   ```
   The compiled static assets will be output to the `dist/` directory.

6. Preview the production build locally:
   ```bash
   npm run preview
   ```

---

## 🚀 Deployment

The project is built as a zero-server single-page application (SPA), making it natively compatible with static hosting platforms like **Vercel**, **Netlify**, or **GitHub Pages**.

### Deploy to Vercel
A `vercel.json` configuration is included out of the box:
```bash
npm install -g vercel
vercel
```
Or connect your GitHub repository directly to [Vercel](https://vercel.com) for automatic preview and production deployments.

---

## 🤝 Contributing

Contributions are welcome and appreciated! To contribute:

1. Fork the repository.
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add vintage envelope paper template"
   ```
4. Verify tests and build:
   ```bash
   npm test && npm run build
   ```
5. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
6. Open a **Pull Request**.

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Crafted with ❤️ by <a href="https://github.com/fauzanlm">Fauzan</a> & the Open Source Community.
</p>
