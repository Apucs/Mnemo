# Mnemo — Tile Workspace Design Spec

**Date:** 2026-06-13
**Scope:** First sub-project — the core tile/grid workspace (local-first, no auth, no database)

---

## 1. Overview

Mnemo is a collaborative, visual knowledge-sharing platform for organizing complex information using a tile-based grid system. This spec covers the foundational workspace: a local-first visual editor where users create, arrange, resize, and nest tiles with rich content.

Subsequent sub-projects (auth, cloud sync, collaboration, discovery) will build on this foundation.

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React + Next.js | Best drag-and-drop ecosystem, SSR/API routes ready for future backend |
| Styling | Tailwind CSS | Zero runtime cost, fast development, small purged bundles |
| State management | Zustand | Lightweight, selector-based subscriptions, no boilerplate |
| Architecture | Entity-Component | Flat tile store, granular re-renders, clean future DB mapping |
| Grid system | Hybrid (free-form + snap-to-grid) | Flexibility with optional alignment |
| Nesting model | Drill-down navigation + breadcrumbs | Scales to any depth, keeps each level clean |
| Persistence | localStorage + file export/import | No backend needed; storage abstraction layer for future DB |
| Theme | Light + dark, minimal/clean design | Tailwind dark: prefix, user toggle |

## 3. Data Model

### Tile

```typescript
interface Tile {
  id: string;
  parentId: string | null;    // null = root level
  boardId: string;
  type: 'text' | 'code' | 'latex' | 'image' | 'pdf' | 'container';
  content: string;            // markdown, code, LaTeX source, blob URL, etc.
  meta: Record<string, any>;  // language for code, page range for PDF, etc.
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  gridSnap: boolean;          // per-tile snap override
  createdAt: string;
  updatedAt: string;
}
```

### Board

```typescript
interface Board {
  id: string;
  title: string;
  tiles: Record<string, Tile>; // flat map, keyed by tile ID
  rootTileIds: string[];       // ordered list of top-level tile IDs
  gridSettings: {
    snapEnabled: boolean;      // global default
    gridSize: number;          // snap increment in px
  };
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}
```

### BoardSummary

```typescript
interface BoardSummary {
  id: string;
  title: string;
  tileCount: number;
  updatedAt: string;
}
```

**Key points:**
- Flat tile map — nesting is expressed via `parentId`, not nested objects.
- `container` type tiles hold children. Double-clicking drills down; breadcrumbs navigate back.
- Each tile controls its own `gridSnap` override; the board provides the default.

## 4. Storage Abstraction Layer

```typescript
interface StorageProvider {
  saveBoard(board: Board): Promise<void>;
  loadBoard(id: string): Promise<Board | null>;
  listBoards(): Promise<BoardSummary[]>;
  deleteBoard(id: string): Promise<void>;
  exportBoard(id: string): Promise<string>;    // JSON string
  importBoard(json: string): Promise<Board>;
}
```

**Three implementations:**

1. **LocalStorageProvider** — default. Reads/writes to `localStorage` with a `mnemo:` key prefix. Auto-save triggers on every state change with a debounced 500ms write.
2. **FileProvider** — exports/imports via browser File API (download JSON, upload JSON).
3. **DatabaseProvider** — stub with the same interface, wired up in a future sub-project.

The Zustand store calls the active provider. Switching providers requires no component changes.

## 5. Component Architecture

```
App
├── BoardList                  // home screen: list boards, create new, import
├── BoardView                  // the workspace for one board
│   ├── Toolbar                // add tile, toggle grid snap, theme switch, export/import
│   ├── Breadcrumbs            // navigation trail for nested tiles
│   ├── Canvas                 // the drag/drop surface
│   │   ├── TileWrapper        // handles position, resize, drag, selection (shared)
│   │   │   ├── TextTile       // rich text editor (Tiptap)
│   │   │   ├── CodeTile       // syntax-highlighted code block (Prism.js)
│   │   │   ├── LatexTile      // LaTeX rendered via KaTeX
│   │   │   ├── ImageTile      // image display + upload
│   │   │   ├── PdfTile        // PDF embed/viewer (react-pdf)
│   │   │   └── ContainerTile  // shows child count/preview, click to drill down
│   │   └── GridOverlay        // optional snap grid lines
│   ├── AssetPanel             // toggleable sidebar: board's media files
│   └── TileContextMenu        // right-click: delete, duplicate, change type, nest
```

**TileWrapper** is the shared shell — handles drag (dnd-kit), resize (edge/corner handles), z-index, and selection state. Renders the appropriate content component based on `tile.type`.

**Canvas** only renders tiles where `parentId` matches the current navigation level. Drilling into a container changes the active `parentId`.

**AssetPanel** shows thumbnails of all media in the current board. Click to highlight, drag to reuse.

## 6. Key Libraries

| Purpose | Library | Rationale |
|---|---|---|
| State management | Zustand | Lightweight, selector-based subscriptions |
| Drag & drop | dnd-kit | Modern, accessible, customizable for grid + freeform |
| Code highlighting | Prism.js | Lightweight, 200+ languages |
| LaTeX rendering | KaTeX | 10x faster than MathJax, synchronous rendering |
| PDF viewing | react-pdf | Renders PDF pages as canvas, page navigation built-in |
| Rich text editing | Tiptap | Extensible, ProseMirror-based, markdown-compatible |
| Undo/redo | zustand-temporal | Middleware that adds undo/redo to any Zustand store |

## 7. Interaction Model

| Action | Behavior |
|---|---|
| Click tile | Select — shows resize handles + toolbar |
| Double-click tile | Enter edit mode for content |
| Drag tile body | Move tile on canvas |
| Drag edge/corner handles | Resize tile |
| Right-click tile | Context menu: delete, duplicate, change type, wrap in container |
| Double-click container | Drill down into child tiles |
| Breadcrumbs click | Navigate back up the nesting hierarchy |
| Ctrl/Cmd + Z/Y | Undo / redo |
| Ctrl/Cmd + S | Force save |
| Ctrl/Cmd + G | Toggle grid snap |
| Ctrl/Cmd + V | Paste image/text as new tile |
| Drag files onto canvas | Auto-create tiles (detects image, PDF, text) |
| Drop multiple files | Auto-arrange tiles in a row |

## 8. Performance Strategy

**Rendering:**
- Selective Zustand subscriptions — each TileWrapper uses `useTileById(id)`, only changed tiles re-render.
- Lazy content renderers — KaTeX, Prism, react-pdf are code-split via `React.lazy()`.
- Virtualization — off-screen tiles replaced with lightweight placeholders.

**Saves:**
- Debounced auto-save — 500ms after last change.
- Structural sharing — unchanged tiles keep same object reference.

**Assets:**
- Images stored as blob URLs in localStorage with size warnings (>5MB per image).
- PDFs lazy-load only the visible page.

**Bundle:**
- Next.js code splitting — each tile type is its own chunk.
- Tailwind purge — production CSS contains only used classes.
- Target: <200KB initial JS (before content-type chunks).

## 9. Entry Points

### A) Blank Board
- "New Board" from home screen creates empty canvas.
- Default title "Untitled Board" (click to rename).

### B) Example Boards
- Bundled as JSON files, no network needed.
- Starters:
  - "Machine Learning Basics" — text, LaTeX, nested tiles.
  - "Research Paper Breakdown" — PDF embed + annotation tiles.
- Opens as a new editable board.

### C) Content Import
- **JSON import** — load a previously exported Mnemo board.
- **Drag & drop files** onto canvas — auto-creates correct tile type.
- **Paste from clipboard** — images or text become new tiles.
- **File picker** in toolbar for browsing local files.
- **Multi-file drop** — tiles auto-arrange.

## 10. Home Screen

```
┌──────────────────────────────────────┐
│  Mnemo                        [☀/🌙] │
│                                      │
│  [+ New Board]  [Import JSON]        │
│                                      │
│  Your Boards                         │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ ML   │ │ Paper│ │ ...  │         │
│  │Basics│ │Review│ │      │         │
│  └──────┘ └──────┘ └──────┘         │
│                                      │
│  Examples                            │
│  ┌──────┐ ┌──────┐                  │
│  │ ML   │ │Paper │                  │
│  │Intro │ │Break.│                  │
│  └──────┘ └──────┘                  │
└──────────────────────────────────────┘
```

## 11. Out of Scope (Future Sub-Projects)

- User authentication / accounts
- Database persistence (PostgreSQL, etc.)
- Cloud sync
- Collaboration / sharing / privacy toggles
- Unique shareable URLs
- Board forking/cloning
- Global search / tagging / social following
- Object storage (S3)
