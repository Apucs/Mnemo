# Tile Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core Mnemo tile workspace — a local-first visual editor with drag-and-drop tiles, rich content rendering, nested navigation, and hybrid grid snapping.

**Architecture:** Entity-Component pattern with a flat Zustand store of tile entities keyed by ID. Nesting via `parentId`. Storage abstraction layer with localStorage as default, file export/import, and a stub for future database. React components subscribe to individual tiles via selectors for granular re-renders.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand, dnd-kit, Tiptap, KaTeX, Prism.js, react-pdf, zustand-temporal

---

## File Structure

```
mnemo/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout: ThemeProvider, fonts, global styles
│   │   ├── page.tsx                    # Home screen — renders BoardList
│   │   └── board/
│   │       └── [id]/
│   │           └── page.tsx            # Board workspace — renders BoardView
│   ├── components/
│   │   ├── board-list/
│   │   │   ├── BoardList.tsx           # Home screen: grid of board cards
│   │   │   ├── BoardCard.tsx           # Single board preview card
│   │   │   └── ImportButton.tsx        # JSON import trigger
│   │   ├── board-view/
│   │   │   ├── BoardView.tsx           # Main workspace layout shell
│   │   │   ├── Toolbar.tsx             # Top toolbar: add tile, snap, theme, export
│   │   │   ├── Breadcrumbs.tsx         # Nesting navigation trail
│   │   │   ├── Canvas.tsx              # Drag/drop surface, renders tiles
│   │   │   ├── GridOverlay.tsx         # Optional snap grid lines
│   │   │   ├── AssetPanel.tsx          # Toggleable sidebar: board media
│   │   │   └── TileContextMenu.tsx     # Right-click menu
│   │   ├── tiles/
│   │   │   ├── TileWrapper.tsx         # Shared shell: drag, resize, select
│   │   │   ├── TextTile.tsx            # Rich text via Tiptap
│   │   │   ├── CodeTile.tsx            # Syntax-highlighted code
│   │   │   ├── LatexTile.tsx           # KaTeX-rendered math
│   │   │   ├── ImageTile.tsx           # Image display + upload
│   │   │   ├── PdfTile.tsx             # PDF viewer
│   │   │   └── ContainerTile.tsx       # Nested tile container
│   │   └── ui/
│   │       └── ThemeToggle.tsx         # Light/dark theme switch
│   ├── store/
│   │   ├── board-store.ts              # Zustand store: board + tile state + actions
│   │   └── ui-store.ts                 # Zustand store: selection, navigation, snap state
│   ├── storage/
│   │   ├── types.ts                    # StorageProvider interface, Board, Tile, BoardSummary types
│   │   ├── local-storage-provider.ts   # localStorage implementation
│   │   ├── file-provider.ts            # JSON file export/import
│   │   └── index.ts                    # Active provider export
│   ├── hooks/
│   │   ├── use-tile.ts                 # useTileById selector hook
│   │   ├── use-auto-save.ts            # Debounced auto-save hook
│   │   └── use-keyboard-shortcuts.ts   # Global keyboard shortcuts
│   └── lib/
│       ├── id.ts                       # ID generation (nanoid)
│       └── grid.ts                     # Snap-to-grid math utilities
├── public/
│   └── examples/
│       ├── ml-basics.json              # Example board: ML Basics
│       └── paper-breakdown.json        # Example board: Research Paper
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── __tests__/
    ├── storage/
    │   └── local-storage-provider.test.ts
    ├── store/
    │   ├── board-store.test.ts
    │   └── ui-store.test.ts
    └── lib/
        ├── id.test.ts
        └── grid.test.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `.gitignore`

- [ ] **Step 1: Initialize Next.js project**

Run:
```bash
cd /mnt/E2AE16C1AE168DE3/mnemo
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: Project scaffolded with `src/app/`, `tailwind.config.ts`, `package.json`.

- [ ] **Step 2: Install core dependencies**

Run:
```bash
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities nanoid zundo
```

Expected: Dependencies added to `package.json`.

- [ ] **Step 3: Install content renderer dependencies**

Run:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm katex prismjs react-pdf pdfjs-dist
npm install -D @types/katex @types/prismjs
```

Expected: All content rendering libraries installed.

- [ ] **Step 4: Install test dependencies**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

Expected: Test tooling installed.

- [ ] **Step 5: Create Vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 6: Update .gitignore**

Append to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 7: Verify the app runs**

Run:
```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
```

Expected: HTTP 200.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Types & ID Utility

**Files:**
- Create: `src/storage/types.ts`, `src/lib/id.ts`, `__tests__/lib/id.test.ts`

- [ ] **Step 1: Write failing test for ID generation**

Create `__tests__/lib/id.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateId } from '@/lib/id';

describe('generateId', () => {
  it('returns a string of length 21', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(21);
  });

  it('returns unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/id.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ID utility**

Create `src/lib/id.ts`:
```typescript
import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/id.test.ts`
Expected: PASS

- [ ] **Step 5: Create type definitions**

Create `src/storage/types.ts`:
```typescript
export interface Tile {
  id: string;
  parentId: string | null;
  boardId: string;
  type: 'text' | 'code' | 'latex' | 'image' | 'pdf' | 'container';
  content: string;
  meta: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  gridSnap: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TileType = Tile['type'];

export interface Board {
  id: string;
  title: string;
  tiles: Record<string, Tile>;
  rootTileIds: string[];
  gridSettings: {
    snapEnabled: boolean;
    gridSize: number;
  };
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  id: string;
  title: string;
  tileCount: number;
  updatedAt: string;
}

export interface StorageProvider {
  saveBoard(board: Board): Promise<void>;
  loadBoard(id: string): Promise<Board | null>;
  listBoards(): Promise<BoardSummary[]>;
  deleteBoard(id: string): Promise<void>;
  exportBoard(id: string): Promise<string>;
  importBoard(json: string): Promise<Board>;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/storage/types.ts src/lib/id.ts __tests__/lib/id.test.ts
git commit -m "feat: add core types and ID generation utility"
```

---

## Task 3: Grid Snap Utility

**Files:**
- Create: `src/lib/grid.ts`, `__tests__/lib/grid.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/grid.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { snapToGrid } from '@/lib/grid';

describe('snapToGrid', () => {
  it('snaps position to nearest grid point', () => {
    expect(snapToGrid({ x: 17, y: 23 }, 20)).toEqual({ x: 20, y: 20 });
  });

  it('snaps exactly on grid points', () => {
    expect(snapToGrid({ x: 40, y: 60 }, 20)).toEqual({ x: 40, y: 60 });
  });

  it('rounds to nearest, not floor', () => {
    expect(snapToGrid({ x: 11, y: 9 }, 20)).toEqual({ x: 20, y: 0 });
  });

  it('handles grid size of 1 (no snapping)', () => {
    expect(snapToGrid({ x: 17, y: 23 }, 1)).toEqual({ x: 17, y: 23 });
  });

  it('handles negative coordinates', () => {
    expect(snapToGrid({ x: -13, y: -27 }, 20)).toEqual({ x: -20, y: -20 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/grid.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement grid utility**

Create `src/lib/grid.ts`:
```typescript
export interface Position {
  x: number;
  y: number;
}

export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/grid.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/grid.ts __tests__/lib/grid.test.ts
git commit -m "feat: add snap-to-grid utility"
```

---

## Task 4: LocalStorage Provider

**Files:**
- Create: `src/storage/local-storage-provider.ts`, `src/storage/index.ts`, `__tests__/storage/local-storage-provider.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/storage/local-storage-provider.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageProvider } from '@/storage/local-storage-provider';
import type { Board } from '@/storage/types';

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 'board-1',
    title: 'Test Board',
    tiles: {},
    rootTileIds: [],
    gridSettings: { snapEnabled: true, gridSize: 20 },
    theme: 'light',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    localStorage.clear();
    provider = new LocalStorageProvider();
  });

  it('saves and loads a board', async () => {
    const board = makeBoard();
    await provider.saveBoard(board);
    const loaded = await provider.loadBoard('board-1');
    expect(loaded).toEqual(board);
  });

  it('returns null for non-existent board', async () => {
    const loaded = await provider.loadBoard('nope');
    expect(loaded).toBeNull();
  });

  it('lists boards as summaries', async () => {
    await provider.saveBoard(makeBoard({ id: 'b1', title: 'First' }));
    await provider.saveBoard(makeBoard({ id: 'b2', title: 'Second', tiles: { t1: {} as any } }));
    const list = await provider.listBoards();
    expect(list).toHaveLength(2);
    expect(list.find(b => b.id === 'b2')?.tileCount).toBe(1);
  });

  it('deletes a board', async () => {
    await provider.saveBoard(makeBoard());
    await provider.deleteBoard('board-1');
    const loaded = await provider.loadBoard('board-1');
    expect(loaded).toBeNull();
  });

  it('exports a board as JSON string', async () => {
    const board = makeBoard();
    await provider.saveBoard(board);
    const json = await provider.exportBoard('board-1');
    expect(JSON.parse(json)).toEqual(board);
  });

  it('imports a board from JSON string', async () => {
    const board = makeBoard({ id: 'imported' });
    const imported = await provider.importBoard(JSON.stringify(board));
    expect(imported.id).toBe('imported');
    const loaded = await provider.loadBoard('imported');
    expect(loaded).toEqual(board);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/storage/local-storage-provider.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement LocalStorageProvider**

Create `src/storage/local-storage-provider.ts`:
```typescript
import type { Board, BoardSummary, StorageProvider } from './types';

const PREFIX = 'mnemo:board:';

export class LocalStorageProvider implements StorageProvider {
  async saveBoard(board: Board): Promise<void> {
    localStorage.setItem(PREFIX + board.id, JSON.stringify(board));
  }

  async loadBoard(id: string): Promise<Board | null> {
    const raw = localStorage.getItem(PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as Board;
  }

  async listBoards(): Promise<BoardSummary[]> {
    const summaries: BoardSummary[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const board = JSON.parse(raw) as Board;
      summaries.push({
        id: board.id,
        title: board.title,
        tileCount: Object.keys(board.tiles).length,
        updatedAt: board.updatedAt,
      });
    }
    return summaries;
  }

  async deleteBoard(id: string): Promise<void> {
    localStorage.removeItem(PREFIX + id);
  }

  async exportBoard(id: string): Promise<string> {
    const board = await this.loadBoard(id);
    if (!board) throw new Error(`Board not found: ${id}`);
    return JSON.stringify(board);
  }

  async importBoard(json: string): Promise<Board> {
    const board = JSON.parse(json) as Board;
    await this.saveBoard(board);
    return board;
  }
}
```

- [ ] **Step 4: Create storage index**

Create `src/storage/index.ts`:
```typescript
import { LocalStorageProvider } from './local-storage-provider';
import type { StorageProvider } from './types';

export const storage: StorageProvider = new LocalStorageProvider();
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run __tests__/storage/local-storage-provider.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/storage/ __tests__/storage/
git commit -m "feat: add LocalStorageProvider with storage abstraction"
```

---

## Task 5: File Provider (Export/Import)

**Files:**
- Create: `src/storage/file-provider.ts`

- [ ] **Step 1: Implement FileProvider**

Create `src/storage/file-provider.ts`:
```typescript
import type { Board } from './types';

export function downloadBoardAsJson(board: Board): void {
  const json = JSON.stringify(board, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${board.title.replace(/\s+/g, '-').toLowerCase()}.mnemo.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openBoardFromFile(): Promise<Board> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.mnemo.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const text = await file.text();
      const board = JSON.parse(text) as Board;
      resolve(board);
    };
    input.click();
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/storage/file-provider.ts
git commit -m "feat: add file-based export/import for boards"
```

---

## Task 6: Board Store (Zustand)

**Files:**
- Create: `src/store/board-store.ts`, `__tests__/store/board-store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/store/board-store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardStore } from '@/store/board-store';

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({
      board: null,
    });
  });

  it('creates a new board', () => {
    useBoardStore.getState().createBoard('My Board');
    const board = useBoardStore.getState().board;
    expect(board).not.toBeNull();
    expect(board!.title).toBe('My Board');
    expect(board!.tiles).toEqual({});
    expect(board!.rootTileIds).toEqual([]);
  });

  it('adds a tile to the board', () => {
    useBoardStore.getState().createBoard('Test');
    useBoardStore.getState().addTile({
      type: 'text',
      content: 'Hello',
      position: { x: 100, y: 200 },
      parentId: null,
    });
    const board = useBoardStore.getState().board!;
    const tileIds = Object.keys(board.tiles);
    expect(tileIds).toHaveLength(1);
    const tile = board.tiles[tileIds[0]];
    expect(tile.type).toBe('text');
    expect(tile.content).toBe('Hello');
    expect(tile.position).toEqual({ x: 100, y: 200 });
    expect(board.rootTileIds).toContain(tile.id);
  });

  it('adds a child tile with parentId', () => {
    useBoardStore.getState().createBoard('Test');
    useBoardStore.getState().addTile({
      type: 'container',
      content: '',
      position: { x: 0, y: 0 },
      parentId: null,
    });
    const parentId = useBoardStore.getState().board!.rootTileIds[0];
    useBoardStore.getState().addTile({
      type: 'text',
      content: 'Child',
      position: { x: 10, y: 10 },
      parentId,
    });
    const board = useBoardStore.getState().board!;
    const childTile = Object.values(board.tiles).find(t => t.content === 'Child');
    expect(childTile!.parentId).toBe(parentId);
    expect(board.rootTileIds).not.toContain(childTile!.id);
  });

  it('updates tile position', () => {
    useBoardStore.getState().createBoard('Test');
    useBoardStore.getState().addTile({
      type: 'text',
      content: '',
      position: { x: 0, y: 0 },
      parentId: null,
    });
    const id = useBoardStore.getState().board!.rootTileIds[0];
    useBoardStore.getState().updateTile(id, { position: { x: 50, y: 75 } });
    expect(useBoardStore.getState().board!.tiles[id].position).toEqual({ x: 50, y: 75 });
  });

  it('updates tile content', () => {
    useBoardStore.getState().createBoard('Test');
    useBoardStore.getState().addTile({
      type: 'text',
      content: 'old',
      position: { x: 0, y: 0 },
      parentId: null,
    });
    const id = useBoardStore.getState().board!.rootTileIds[0];
    useBoardStore.getState().updateTile(id, { content: 'new' });
    expect(useBoardStore.getState().board!.tiles[id].content).toBe('new');
  });

  it('deletes a tile', () => {
    useBoardStore.getState().createBoard('Test');
    useBoardStore.getState().addTile({
      type: 'text',
      content: '',
      position: { x: 0, y: 0 },
      parentId: null,
    });
    const id = useBoardStore.getState().board!.rootTileIds[0];
    useBoardStore.getState().deleteTile(id);
    expect(useBoardStore.getState().board!.tiles[id]).toBeUndefined();
    expect(useBoardStore.getState().board!.rootTileIds).not.toContain(id);
  });

  it('deletes a container and all its children', () => {
    useBoardStore.getState().createBoard('Test');
    useBoardStore.getState().addTile({
      type: 'container',
      content: '',
      position: { x: 0, y: 0 },
      parentId: null,
    });
    const parentId = useBoardStore.getState().board!.rootTileIds[0];
    useBoardStore.getState().addTile({
      type: 'text',
      content: 'Child',
      position: { x: 0, y: 0 },
      parentId,
    });
    useBoardStore.getState().deleteTile(parentId);
    expect(Object.keys(useBoardStore.getState().board!.tiles)).toHaveLength(0);
  });

  it('duplicates a tile', () => {
    useBoardStore.getState().createBoard('Test');
    useBoardStore.getState().addTile({
      type: 'text',
      content: 'original',
      position: { x: 100, y: 100 },
      parentId: null,
    });
    const id = useBoardStore.getState().board!.rootTileIds[0];
    useBoardStore.getState().duplicateTile(id);
    const board = useBoardStore.getState().board!;
    expect(Object.keys(board.tiles)).toHaveLength(2);
    const duplicate = Object.values(board.tiles).find(t => t.id !== id)!;
    expect(duplicate.content).toBe('original');
    expect(duplicate.position.x).toBe(120);
    expect(duplicate.position.y).toBe(120);
  });

  it('renames the board', () => {
    useBoardStore.getState().createBoard('Old');
    useBoardStore.getState().renameBoard('New');
    expect(useBoardStore.getState().board!.title).toBe('New');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/store/board-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement board store**

Create `src/store/board-store.ts`:
```typescript
import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Board, Tile, TileType } from '@/storage/types';
import { generateId } from '@/lib/id';

interface AddTileParams {
  type: TileType;
  content: string;
  position: { x: number; y: number };
  parentId: string | null;
  meta?: Record<string, any>;
  size?: { width: number; height: number };
}

interface BoardState {
  board: Board | null;
  createBoard: (title: string) => void;
  loadBoard: (board: Board) => void;
  renameBoard: (title: string) => void;
  addTile: (params: AddTileParams) => string;
  updateTile: (id: string, updates: Partial<Tile>) => void;
  deleteTile: (id: string) => void;
  duplicateTile: (id: string) => void;
  updateGridSettings: (settings: Partial<Board['gridSettings']>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useBoardStore = create<BoardState>()(
  temporal(
    (set, get) => ({
      board: null,

      createBoard: (title: string) => {
        const now = new Date().toISOString();
        set({
          board: {
            id: generateId(),
            title,
            tiles: {},
            rootTileIds: [],
            gridSettings: { snapEnabled: true, gridSize: 20 },
            theme: 'light',
            createdAt: now,
            updatedAt: now,
          },
        });
      },

      loadBoard: (board: Board) => {
        set({ board });
      },

      renameBoard: (title: string) => {
        const board = get().board;
        if (!board) return;
        set({
          board: { ...board, title, updatedAt: new Date().toISOString() },
        });
      },

      addTile: (params: AddTileParams) => {
        const board = get().board;
        if (!board) return '';
        const now = new Date().toISOString();
        const id = generateId();
        const tile: Tile = {
          id,
          parentId: params.parentId,
          boardId: board.id,
          type: params.type,
          content: params.content,
          meta: params.meta ?? {},
          position: params.position,
          size: params.size ?? { width: 300, height: 200 },
          zIndex: Object.keys(board.tiles).length,
          gridSnap: board.gridSettings.snapEnabled,
          createdAt: now,
          updatedAt: now,
        };
        const rootTileIds = params.parentId === null
          ? [...board.rootTileIds, id]
          : board.rootTileIds;
        set({
          board: {
            ...board,
            tiles: { ...board.tiles, [id]: tile },
            rootTileIds,
            updatedAt: now,
          },
        });
        return id;
      },

      updateTile: (id: string, updates: Partial<Tile>) => {
        const board = get().board;
        if (!board || !board.tiles[id]) return;
        set({
          board: {
            ...board,
            tiles: {
              ...board.tiles,
              [id]: {
                ...board.tiles[id],
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      deleteTile: (id: string) => {
        const board = get().board;
        if (!board) return;
        const toDelete = new Set<string>();
        const collectChildren = (parentId: string) => {
          toDelete.add(parentId);
          Object.values(board.tiles).forEach(t => {
            if (t.parentId === parentId) collectChildren(t.id);
          });
        };
        collectChildren(id);
        const tiles = { ...board.tiles };
        toDelete.forEach(tileId => delete tiles[tileId]);
        set({
          board: {
            ...board,
            tiles,
            rootTileIds: board.rootTileIds.filter(rid => !toDelete.has(rid)),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      duplicateTile: (id: string) => {
        const board = get().board;
        if (!board || !board.tiles[id]) return;
        const original = board.tiles[id];
        const now = new Date().toISOString();
        const newId = generateId();
        const duplicate: Tile = {
          ...original,
          id: newId,
          position: {
            x: original.position.x + 20,
            y: original.position.y + 20,
          },
          createdAt: now,
          updatedAt: now,
        };
        const rootTileIds = original.parentId === null
          ? [...board.rootTileIds, newId]
          : board.rootTileIds;
        set({
          board: {
            ...board,
            tiles: { ...board.tiles, [newId]: duplicate },
            rootTileIds,
            updatedAt: now,
          },
        });
      },

      updateGridSettings: (settings: Partial<Board['gridSettings']>) => {
        const board = get().board;
        if (!board) return;
        set({
          board: {
            ...board,
            gridSettings: { ...board.gridSettings, ...settings },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      setTheme: (theme: 'light' | 'dark') => {
        const board = get().board;
        if (!board) return;
        set({
          board: { ...board, theme, updatedAt: new Date().toISOString() },
        });
      },
    }),
    { limit: 50 }
  )
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/store/board-store.test.ts`
Expected: PASS (all 9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store/board-store.ts __tests__/store/board-store.test.ts
git commit -m "feat: add board Zustand store with tile CRUD and undo/redo"
```

---

## Task 7: UI Store

**Files:**
- Create: `src/store/ui-store.ts`, `__tests__/store/ui-store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/store/ui-store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/store/ui-store';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      selectedTileId: null,
      editingTileId: null,
      navigationPath: [],
      currentParentId: null,
      assetPanelOpen: false,
      contextMenu: null,
    });
  });

  it('selects a tile', () => {
    useUiStore.getState().selectTile('tile-1');
    expect(useUiStore.getState().selectedTileId).toBe('tile-1');
  });

  it('deselects when selecting null', () => {
    useUiStore.getState().selectTile('tile-1');
    useUiStore.getState().selectTile(null);
    expect(useUiStore.getState().selectedTileId).toBeNull();
  });

  it('enters editing mode', () => {
    useUiStore.getState().startEditing('tile-1');
    expect(useUiStore.getState().editingTileId).toBe('tile-1');
    expect(useUiStore.getState().selectedTileId).toBe('tile-1');
  });

  it('stops editing', () => {
    useUiStore.getState().startEditing('tile-1');
    useUiStore.getState().stopEditing();
    expect(useUiStore.getState().editingTileId).toBeNull();
  });

  it('navigates into a container', () => {
    useUiStore.getState().navigateInto('container-1', 'My Container');
    expect(useUiStore.getState().currentParentId).toBe('container-1');
    expect(useUiStore.getState().navigationPath).toEqual([
      { id: 'container-1', title: 'My Container' },
    ]);
  });

  it('navigates back to root', () => {
    useUiStore.getState().navigateInto('c1', 'C1');
    useUiStore.getState().navigateInto('c2', 'C2');
    useUiStore.getState().navigateToIndex(-1);
    expect(useUiStore.getState().currentParentId).toBeNull();
    expect(useUiStore.getState().navigationPath).toEqual([]);
  });

  it('navigates to a specific breadcrumb', () => {
    useUiStore.getState().navigateInto('c1', 'C1');
    useUiStore.getState().navigateInto('c2', 'C2');
    useUiStore.getState().navigateInto('c3', 'C3');
    useUiStore.getState().navigateToIndex(0);
    expect(useUiStore.getState().currentParentId).toBe('c1');
    expect(useUiStore.getState().navigationPath).toHaveLength(1);
  });

  it('toggles asset panel', () => {
    useUiStore.getState().toggleAssetPanel();
    expect(useUiStore.getState().assetPanelOpen).toBe(true);
    useUiStore.getState().toggleAssetPanel();
    expect(useUiStore.getState().assetPanelOpen).toBe(false);
  });

  it('opens context menu', () => {
    useUiStore.getState().openContextMenu('tile-1', { x: 100, y: 200 });
    expect(useUiStore.getState().contextMenu).toEqual({
      tileId: 'tile-1',
      position: { x: 100, y: 200 },
    });
  });

  it('closes context menu', () => {
    useUiStore.getState().openContextMenu('tile-1', { x: 100, y: 200 });
    useUiStore.getState().closeContextMenu();
    expect(useUiStore.getState().contextMenu).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/store/ui-store.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement UI store**

Create `src/store/ui-store.ts`:
```typescript
import { create } from 'zustand';

interface BreadcrumbEntry {
  id: string;
  title: string;
}

interface ContextMenuState {
  tileId: string;
  position: { x: number; y: number };
}

interface UiState {
  selectedTileId: string | null;
  editingTileId: string | null;
  navigationPath: BreadcrumbEntry[];
  currentParentId: string | null;
  assetPanelOpen: boolean;
  contextMenu: ContextMenuState | null;

  selectTile: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  navigateInto: (id: string, title: string) => void;
  navigateToIndex: (index: number) => void;
  toggleAssetPanel: () => void;
  openContextMenu: (tileId: string, position: { x: number; y: number }) => void;
  closeContextMenu: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  selectedTileId: null,
  editingTileId: null,
  navigationPath: [],
  currentParentId: null,
  assetPanelOpen: false,
  contextMenu: null,

  selectTile: (id) => set({ selectedTileId: id }),

  startEditing: (id) => set({ editingTileId: id, selectedTileId: id }),

  stopEditing: () => set({ editingTileId: null }),

  navigateInto: (id, title) =>
    set((state) => ({
      currentParentId: id,
      navigationPath: [...state.navigationPath, { id, title }],
      selectedTileId: null,
      editingTileId: null,
    })),

  navigateToIndex: (index) =>
    set((state) => {
      if (index < 0) {
        return { currentParentId: null, navigationPath: [] };
      }
      const path = state.navigationPath.slice(0, index + 1);
      return {
        currentParentId: path[path.length - 1].id,
        navigationPath: path,
      };
    }),

  toggleAssetPanel: () =>
    set((state) => ({ assetPanelOpen: !state.assetPanelOpen })),

  openContextMenu: (tileId, position) =>
    set({ contextMenu: { tileId, position } }),

  closeContextMenu: () => set({ contextMenu: null }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/store/ui-store.test.ts`
Expected: PASS (all 10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store/ui-store.ts __tests__/store/ui-store.test.ts
git commit -m "feat: add UI store for selection, navigation, and context menu"
```

---

## Task 8: Auto-Save & Keyboard Shortcuts Hooks

**Files:**
- Create: `src/hooks/use-tile.ts`, `src/hooks/use-auto-save.ts`, `src/hooks/use-keyboard-shortcuts.ts`

- [ ] **Step 1: Create tile selector hook**

Create `src/hooks/use-tile.ts`:
```typescript
import { useBoardStore } from '@/store/board-store';
import type { Tile } from '@/storage/types';

export function useTileById(id: string): Tile | undefined {
  return useBoardStore((state) => state.board?.tiles[id]);
}

export function useTilesForParent(parentId: string | null): Tile[] {
  return useBoardStore((state) => {
    if (!state.board) return [];
    return Object.values(state.board.tiles).filter(
      (t) => t.parentId === parentId
    );
  });
}
```

- [ ] **Step 2: Create auto-save hook**

Create `src/hooks/use-auto-save.ts`:
```typescript
import { useEffect, useRef } from 'react';
import { useBoardStore } from '@/store/board-store';
import { storage } from '@/storage';

export function useAutoSave(delayMs = 500) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = useBoardStore.subscribe((state) => {
      if (!state.board) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        storage.saveBoard(state.board!);
      }, delayMs);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delayMs]);
}
```

- [ ] **Step 3: Create keyboard shortcuts hook**

Create `src/hooks/use-keyboard-shortcuts.ts`:
```typescript
import { useEffect } from 'react';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { storage } from '@/storage';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'z': {
          e.preventDefault();
          if (e.shiftKey) {
            useBoardStore.temporal.getState().redo();
          } else {
            useBoardStore.temporal.getState().undo();
          }
          break;
        }
        case 'y': {
          e.preventDefault();
          useBoardStore.temporal.getState().redo();
          break;
        }
        case 's': {
          e.preventDefault();
          const board = useBoardStore.getState().board;
          if (board) storage.saveBoard(board);
          break;
        }
        case 'g': {
          e.preventDefault();
          const board = useBoardStore.getState().board;
          if (board) {
            useBoardStore.getState().updateGridSettings({
              snapEnabled: !board.gridSettings.snapEnabled,
            });
          }
          break;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedTileId, editingTileId } = useUiStore.getState();
        if (selectedTileId && !editingTileId) {
          e.preventDefault();
          useBoardStore.getState().deleteTile(selectedTileId);
          useUiStore.getState().selectTile(null);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: add tile selector, auto-save, and keyboard shortcut hooks"
```

---

## Task 9: Theme Provider & Root Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/ui/ThemeToggle.tsx`

- [ ] **Step 1: Create ThemeToggle component**

Create `src/components/ui/ThemeToggle.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('mnemo:theme');
    const prefersDark = stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('mnemo:theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Update root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mnemo',
  description: 'Visual knowledge-sharing platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify app still runs**

Run:
```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/components/ui/ThemeToggle.tsx
git commit -m "feat: add theme toggle and root layout with dark mode"
```

---

## Task 10: Home Screen (BoardList)

**Files:**
- Create: `src/components/board-list/BoardList.tsx`, `src/components/board-list/BoardCard.tsx`, `src/components/board-list/ImportButton.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create BoardCard component**

Create `src/components/board-list/BoardCard.tsx`:
```tsx
'use client';

import Link from 'next/link';
import type { BoardSummary } from '@/storage/types';

interface BoardCardProps {
  board: BoardSummary;
  onDelete: (id: string) => void;
}

export function BoardCard({ board, onDelete }: BoardCardProps) {
  return (
    <div className="group relative border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
      <Link href={`/board/${board.id}`} className="block">
        <h3 className="font-medium text-lg truncate">{board.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {board.tileCount} tile{board.tileCount !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {new Date(board.updatedAt).toLocaleDateString()}
        </p>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onDelete(board.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-all"
        aria-label="Delete board"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create ImportButton component**

Create `src/components/board-list/ImportButton.tsx`:
```tsx
'use client';

import { openBoardFromFile } from '@/storage/file-provider';
import { storage } from '@/storage';

interface ImportButtonProps {
  onImported: () => void;
}

export function ImportButton({ onImported }: ImportButtonProps) {
  const handleImport = async () => {
    try {
      const board = await openBoardFromFile();
      await storage.saveBoard(board);
      onImported();
    } catch {
      // User cancelled file picker
    }
  };

  return (
    <button
      onClick={handleImport}
      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
    >
      Import JSON
    </button>
  );
}
```

- [ ] **Step 3: Create BoardList component**

Create `src/components/board-list/BoardList.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/storage';
import { useBoardStore } from '@/store/board-store';
import type { BoardSummary } from '@/storage/types';
import { BoardCard } from './BoardCard';
import { ImportButton } from './ImportButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const EXAMPLES = [
  { file: 'ml-basics', title: 'Machine Learning Basics' },
  { file: 'paper-breakdown', title: 'Research Paper Breakdown' },
];

export function BoardList() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const router = useRouter();

  const loadBoards = async () => {
    const list = await storage.listBoards();
    setBoards(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleNewBoard = () => {
    useBoardStore.getState().createBoard('Untitled Board');
    const board = useBoardStore.getState().board!;
    storage.saveBoard(board);
    router.push(`/board/${board.id}`);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteBoard(id);
    loadBoards();
  };

  const handleOpenExample = async (file: string) => {
    try {
      const res = await fetch(`/examples/${file}.json`);
      const board = await res.json();
      await storage.saveBoard(board);
      router.push(`/board/${board.id}`);
    } catch (err) {
      console.error('Failed to load example:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mnemo</h1>
        <ThemeToggle />
      </div>

      <div className="flex gap-3 mb-8">
        <button
          onClick={handleNewBoard}
          className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
        >
          + New Board
        </button>
        <ImportButton onImported={loadBoards} />
      </div>

      {boards.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Your Boards
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
          Examples
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.file}
              onClick={() => handleOpenExample(ex.file)}
              className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 hover:border-gray-500 dark:hover:border-gray-500 transition-colors text-left"
            >
              <h3 className="font-medium">{ex.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Example board
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Update home page**

Replace `src/app/page.tsx`:
```tsx
import { BoardList } from '@/components/board-list/BoardList';

export default function HomePage() {
  return <BoardList />;
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/board-list/ src/app/page.tsx
git commit -m "feat: add home screen with board list, create, and import"
```

---

## Task 11: Canvas & GridOverlay

**Files:**
- Create: `src/components/board-view/Canvas.tsx`, `src/components/board-view/GridOverlay.tsx`, `src/app/board/[id]/page.tsx`

- [ ] **Step 1: Create GridOverlay component**

Create `src/components/board-view/GridOverlay.tsx`:
```tsx
'use client';

import { useBoardStore } from '@/store/board-store';

export function GridOverlay() {
  const gridSettings = useBoardStore((s) => s.board?.gridSettings);
  if (!gridSettings?.snapEnabled) return null;

  const size = gridSettings.gridSize;

  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.07] dark:opacity-[0.1]"
      style={{
        backgroundImage: `
          linear-gradient(to right, currentColor 1px, transparent 1px),
          linear-gradient(to bottom, currentColor 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
```

- [ ] **Step 2: Create Canvas component**

Create `src/components/board-view/Canvas.tsx`:
```tsx
'use client';

import { useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { useTilesForParent } from '@/hooks/use-tile';
import { snapToGrid } from '@/lib/grid';
import { TileWrapper } from '@/components/tiles/TileWrapper';
import { GridOverlay } from './GridOverlay';

export function Canvas() {
  const currentParentId = useUiStore((s) => s.currentParentId);
  const tiles = useTilesForParent(currentParentId);
  const updateTile = useBoardStore((s) => s.updateTile);
  const gridSettings = useBoardStore((s) => s.board?.gridSettings);
  const selectTile = useUiStore((s) => s.selectTile);
  const closeContextMenu = useUiStore((s) => s.closeContextMenu);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const id = active.id as string;
      const board = useBoardStore.getState().board;
      if (!board) return;
      const tile = board.tiles[id];
      if (!tile) return;

      let newPos = {
        x: tile.position.x + delta.x,
        y: tile.position.y + delta.y,
      };

      if (tile.gridSnap && gridSettings) {
        newPos = snapToGrid(newPos, gridSettings.gridSize);
      }

      updateTile(id, { position: newPos });
    },
    [updateTile, gridSettings]
  );

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectTile(null);
      closeContextMenu();
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className="relative flex-1 overflow-auto bg-gray-50 dark:bg-gray-900"
        onClick={handleCanvasClick}
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
        }}
      >
        <GridOverlay />
        {tiles.map((tile) => (
          <TileWrapper key={tile.id} tileId={tile.id} />
        ))}
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 3: Create board page**

Create `src/app/board/[id]/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage } from '@/storage';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Canvas } from '@/components/board-view/Canvas';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const loadBoard = useBoardStore((s) => s.loadBoard);

  useAutoSave();
  useKeyboardShortcuts();

  useEffect(() => {
    const id = params.id as string;
    storage.loadBoard(id).then((board) => {
      if (!board) {
        router.push('/');
        return;
      }
      loadBoard(board);
      useUiStore.getState().navigateToIndex(-1);
      setLoading(false);
    });
  }, [params.id, loadBoard, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Canvas />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/board-view/Canvas.tsx src/components/board-view/GridOverlay.tsx src/app/board/
git commit -m "feat: add Canvas with drag-and-drop and grid overlay"
```

---

## Task 12: TileWrapper (Drag, Resize, Select)

**Files:**
- Create: `src/components/tiles/TileWrapper.tsx`

- [ ] **Step 1: Create TileWrapper component**

Create `src/components/tiles/TileWrapper.tsx`:
```tsx
'use client';

import { useCallback, useRef, useState, lazy, Suspense } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTileById } from '@/hooks/use-tile';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';

const TextTile = lazy(() => import('./TextTile').then(m => ({ default: m.TextTile })));
const CodeTile = lazy(() => import('./CodeTile').then(m => ({ default: m.CodeTile })));
const LatexTile = lazy(() => import('./LatexTile').then(m => ({ default: m.LatexTile })));
const ImageTile = lazy(() => import('./ImageTile').then(m => ({ default: m.ImageTile })));
const PdfTile = lazy(() => import('./PdfTile').then(m => ({ default: m.PdfTile })));
const ContainerTile = lazy(() => import('./ContainerTile').then(m => ({ default: m.ContainerTile })));

const TILE_COMPONENTS: Record<string, React.LazyExoticComponent<any>> = {
  text: TextTile,
  code: CodeTile,
  latex: LatexTile,
  image: ImageTile,
  pdf: PdfTile,
  container: ContainerTile,
};

interface TileWrapperProps {
  tileId: string;
}

export function TileWrapper({ tileId }: TileWrapperProps) {
  const tile = useTileById(tileId);
  const updateTile = useBoardStore((s) => s.updateTile);
  const selectedTileId = useUiStore((s) => s.selectedTileId);
  const editingTileId = useUiStore((s) => s.editingTileId);
  const selectTile = useUiStore((s) => s.selectTile);
  const startEditing = useUiStore((s) => s.startEditing);
  const openContextMenu = useUiStore((s) => s.openContextMenu);

  const isSelected = selectedTileId === tileId;
  const isEditing = editingTileId === tileId;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: tileId, disabled: isEditing });

  const [resizing, setResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, _corner: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!tile) return;
      setResizing(true);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW: tile.size.width,
        startH: tile.size.height,
      };

      const handleMove = (me: PointerEvent) => {
        if (!resizeRef.current) return;
        const dx = me.clientX - resizeRef.current.startX;
        const dy = me.clientY - resizeRef.current.startY;
        updateTile(tileId, {
          size: {
            width: Math.max(100, resizeRef.current.startW + dx),
            height: Math.max(60, resizeRef.current.startH + dy),
          },
        });
      };

      const handleUp = () => {
        setResizing(false);
        resizeRef.current = null;
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    },
    [tile, tileId, updateTile]
  );

  if (!tile) return null;

  const TileContent = TILE_COMPONENTS[tile.type];
  const style: React.CSSProperties = {
    position: 'absolute',
    left: tile.position.x,
    top: tile.position.y,
    width: tile.size.width,
    height: tile.size.height,
    zIndex: isDragging ? 9999 : tile.zIndex,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-white dark:bg-gray-850 shadow-sm transition-shadow ${
        isSelected
          ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${resizing ? 'select-none' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        selectTile(tileId);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing(tileId);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openContextMenu(tileId, { x: e.clientX, y: e.clientY });
      }}
      {...(isEditing ? {} : { ...attributes, ...listeners })}
    >
      <div className="w-full h-full overflow-hidden rounded-lg">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading...
            </div>
          }
        >
          {TileContent && (
            <TileContent
              tile={tile}
              isEditing={isEditing}
              onUpdate={(updates: any) => updateTile(tileId, updates)}
            />
          )}
        </Suspense>
      </div>

      {isSelected && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
          onPointerDown={(e) => handleResizeStart(e, 'se')}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tiles/TileWrapper.tsx
git commit -m "feat: add TileWrapper with drag, resize, and selection"
```

---

## Task 13: Content Tiles (Text, Code, LaTeX, Image, PDF, Container)

**Files:**
- Create: `src/components/tiles/TextTile.tsx`, `src/components/tiles/CodeTile.tsx`, `src/components/tiles/LatexTile.tsx`, `src/components/tiles/ImageTile.tsx`, `src/components/tiles/PdfTile.tsx`, `src/components/tiles/ContainerTile.tsx`

- [ ] **Step 1: Create TextTile**

Create `src/components/tiles/TextTile.tsx`:
```tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import type { Tile } from '@/storage/types';

interface TextTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function TextTile({ tile, isEditing, onUpdate }: TextTileProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: tile.content || '<p>Click to edit...</p>',
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onUpdate({ content: editor.getHTML() });
    },
  });

  useEffect(() => {
    editor?.setEditable(isEditing);
  }, [isEditing, editor]);

  return (
    <div className="p-3 h-full overflow-auto prose prose-sm dark:prose-invert max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
}
```

- [ ] **Step 2: Create CodeTile**

Create `src/components/tiles/CodeTile.tsx`:
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import type { Tile } from '@/storage/types';

interface CodeTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function CodeTile({ tile, isEditing, onUpdate }: CodeTileProps) {
  const codeRef = useRef<HTMLElement>(null);
  const language = (tile.meta?.language as string) || 'javascript';
  const [editValue, setEditValue] = useState(tile.content);

  useEffect(() => {
    if (!isEditing && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [tile.content, isEditing, language]);

  useEffect(() => {
    setEditValue(tile.content);
  }, [tile.content]);

  if (isEditing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <select
            value={language}
            onChange={(e) => onUpdate({ meta: { ...tile.meta, language: e.target.value } })}
            className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5"
          >
            {['javascript', 'typescript', 'python', 'jsx', 'tsx', 'json', 'bash', 'css'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <textarea
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onUpdate({ content: e.target.value });
          }}
          className="flex-1 p-3 font-mono text-sm bg-gray-900 text-gray-100 resize-none outline-none"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <span className="text-xs text-gray-500">{language}</span>
      </div>
      <pre className="p-3 m-0 text-sm overflow-auto h-[calc(100%-2rem)]">
        <code ref={codeRef} className={`language-${language}`}>
          {tile.content}
        </code>
      </pre>
    </div>
  );
}
```

- [ ] **Step 3: Create LatexTile**

Create `src/components/tiles/LatexTile.tsx`:
```tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { Tile } from '@/storage/types';

interface LatexTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function LatexTile({ tile, isEditing, onUpdate }: LatexTileProps) {
  const [editValue, setEditValue] = useState(tile.content);

  useEffect(() => {
    setEditValue(tile.content);
  }, [tile.content]);

  const rendered = useMemo(() => {
    try {
      return katex.renderToString(tile.content || 'E = mc^2', {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return '<span style="color:red;">Invalid LaTeX</span>';
    }
  }, [tile.content]);

  if (isEditing) {
    return (
      <div className="h-full flex flex-col">
        <textarea
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onUpdate({ content: e.target.value });
          }}
          className="flex-1 p-3 font-mono text-sm bg-white dark:bg-gray-900 resize-none outline-none border-b border-gray-200 dark:border-gray-700"
          placeholder="Enter LaTeX (e.g. E = mc^2)"
          spellCheck={false}
        />
        <div
          className="p-3 flex items-center justify-center overflow-auto"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      </div>
    );
  }

  return (
    <div
      className="p-4 h-full flex items-center justify-center overflow-auto"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
```

- [ ] **Step 4: Create ImageTile**

Create `src/components/tiles/ImageTile.tsx`:
```tsx
'use client';

import { useCallback } from 'react';
import type { Tile } from '@/storage/types';

interface ImageTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function ImageTile({ tile, isEditing, onUpdate }: ImageTileProps) {
  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({ content: reader.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [onUpdate]);

  if (!tile.content) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:text-gray-500 transition-colors"
        onClick={handleFileSelect}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span className="text-sm">Click to add image</span>
      </div>
    );
  }

  return (
    <div className="h-full relative group">
      <img
        src={tile.content}
        alt={tile.meta?.alt || ''}
        className="w-full h-full object-contain"
      />
      {isEditing && (
        <button
          onClick={handleFileSelect}
          className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Replace
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create PdfTile**

Create `src/components/tiles/PdfTile.tsx`:
```tsx
'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { Tile } from '@/storage/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function PdfTile({ tile, isEditing, onUpdate }: PdfTileProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({ content: reader.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [onUpdate]);

  if (!tile.content) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:text-gray-500 transition-colors"
        onClick={handleFileSelect}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span className="text-sm">Click to add PDF</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="text-xs px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
        >
          Prev
        </button>
        <span className="text-xs text-gray-500">
          {currentPage} / {numPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          className="text-xs px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
        >
          Next
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-2">
        <Document
          file={tile.content}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        >
          <Page
            pageNumber={currentPage}
            width={tile.size.width - 20}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create ContainerTile**

Create `src/components/tiles/ContainerTile.tsx`:
```tsx
'use client';

import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import type { Tile } from '@/storage/types';

interface ContainerTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function ContainerTile({ tile, isEditing, onUpdate }: ContainerTileProps) {
  const childCount = useBoardStore((s) => {
    if (!s.board) return 0;
    return Object.values(s.board.tiles).filter((t) => t.parentId === tile.id).length;
  });
  const navigateInto = useUiStore((s) => s.navigateInto);

  const handleDrillDown = () => {
    navigateInto(tile.id, tile.content || 'Container');
  };

  return (
    <div
      className="h-full flex flex-col items-center justify-center gap-2 p-4 cursor-pointer"
      onDoubleClick={(e) => {
        e.stopPropagation();
        handleDrillDown();
      }}
    >
      <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </div>
      {isEditing ? (
        <input
          type="text"
          value={tile.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="text-center text-sm font-medium bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none px-2 py-0.5"
          placeholder="Container name"
          autoFocus
        />
      ) : (
        <span className="text-sm font-medium truncate max-w-full">
          {tile.content || 'Container'}
        </span>
      )}
      <span className="text-xs text-gray-400">
        {childCount} item{childCount !== 1 ? 's' : ''} — double-click to open
      </span>
    </div>
  );
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: Build succeeds (there may be warnings for unused CSS imports — that's fine).

- [ ] **Step 8: Commit**

```bash
git add src/components/tiles/
git commit -m "feat: add all content tile types (text, code, latex, image, pdf, container)"
```

---

## Task 14: Toolbar, Breadcrumbs, Context Menu & BoardView Shell

**Files:**
- Create: `src/components/board-view/Toolbar.tsx`, `src/components/board-view/Breadcrumbs.tsx`, `src/components/board-view/TileContextMenu.tsx`, `src/components/board-view/BoardView.tsx`

- [ ] **Step 1: Create Toolbar**

Create `src/components/board-view/Toolbar.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { storage } from '@/storage';
import { downloadBoardAsJson } from '@/storage/file-provider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { TileType } from '@/storage/types';

const TILE_TYPES: { type: TileType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'code', label: 'Code' },
  { type: 'latex', label: 'LaTeX' },
  { type: 'image', label: 'Image' },
  { type: 'pdf', label: 'PDF' },
  { type: 'container', label: 'Container' },
];

export function Toolbar() {
  const board = useBoardStore((s) => s.board);
  const addTile = useBoardStore((s) => s.addTile);
  const renameBoard = useBoardStore((s) => s.renameBoard);
  const currentParentId = useUiStore((s) => s.currentParentId);
  const snapEnabled = board?.gridSettings.snapEnabled ?? true;
  const updateGridSettings = useBoardStore((s) => s.updateGridSettings);
  const router = useRouter();

  const handleAddTile = (type: TileType) => {
    addTile({
      type,
      content: '',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      parentId: currentParentId,
    });
  };

  const handleExport = () => {
    if (board) downloadBoardAsJson(board);
  };

  const handleSave = () => {
    if (board) storage.saveBoard(board);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <button
        onClick={() => router.push('/')}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Back to home"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <input
        type="text"
        value={board?.title ?? ''}
        onChange={(e) => renameBoard(e.target.value)}
        className="font-semibold bg-transparent border-none outline-none px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900 transition-colors"
      />

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

      <div className="flex gap-1">
        {TILE_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => handleAddTile(type)}
            className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

      <button
        onClick={() => updateGridSettings({ snapEnabled: !snapEnabled })}
        className={`px-2.5 py-1 text-sm rounded transition-colors ${
          snapEnabled
            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        Snap {snapEnabled ? 'On' : 'Off'}
      </button>

      <div className="flex-1" />

      <button
        onClick={handleSave}
        className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Save
      </button>
      <button
        onClick={handleExport}
        className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Export
      </button>
      <ThemeToggle />
    </div>
  );
}
```

- [ ] **Step 2: Create Breadcrumbs**

Create `src/components/board-view/Breadcrumbs.tsx`:
```tsx
'use client';

import { useUiStore } from '@/store/ui-store';

export function Breadcrumbs() {
  const navigationPath = useUiStore((s) => s.navigationPath);
  const navigateToIndex = useUiStore((s) => s.navigateToIndex);

  if (navigationPath.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
      <button
        onClick={() => navigateToIndex(-1)}
        className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        Root
      </button>
      {navigationPath.map((entry, i) => (
        <span key={entry.id} className="flex items-center gap-1">
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <button
            onClick={() => navigateToIndex(i)}
            className={`hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              i === navigationPath.length - 1 ? 'text-gray-900 dark:text-gray-100 font-medium' : ''
            }`}
          >
            {entry.title}
          </button>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create TileContextMenu**

Create `src/components/board-view/TileContextMenu.tsx`:
```tsx
'use client';

import { useEffect, useRef } from 'react';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import type { TileType } from '@/storage/types';

const MENU_ITEMS: { label: string; action: string }[] = [
  { label: 'Duplicate', action: 'duplicate' },
  { label: 'Wrap in Container', action: 'wrap' },
  { label: 'Delete', action: 'delete' },
];

const TILE_TYPE_LABELS: Record<TileType, string> = {
  text: 'Text',
  code: 'Code',
  latex: 'LaTeX',
  image: 'Image',
  pdf: 'PDF',
  container: 'Container',
};

export function TileContextMenu() {
  const contextMenu = useUiStore((s) => s.contextMenu);
  const closeContextMenu = useUiStore((s) => s.closeContextMenu);
  const deleteTile = useBoardStore((s) => s.deleteTile);
  const duplicateTile = useBoardStore((s) => s.duplicateTile);
  const updateTile = useBoardStore((s) => s.updateTile);
  const addTile = useBoardStore((s) => s.addTile);
  const board = useBoardStore((s) => s.board);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeContextMenu]);

  if (!contextMenu || !board) return null;

  const tile = board.tiles[contextMenu.tileId];
  if (!tile) return null;

  const handleAction = (action: string) => {
    switch (action) {
      case 'duplicate':
        duplicateTile(contextMenu.tileId);
        break;
      case 'delete':
        deleteTile(contextMenu.tileId);
        break;
      case 'wrap': {
        const containerId = addTile({
          type: 'container',
          content: 'Group',
          position: tile.position,
          parentId: tile.parentId,
          size: { width: tile.size.width + 40, height: tile.size.height + 40 },
        });
        updateTile(contextMenu.tileId, {
          parentId: containerId,
          position: { x: 20, y: 20 },
        });
        break;
      }
      default:
        if (action.startsWith('type:')) {
          const newType = action.slice(5) as TileType;
          updateTile(contextMenu.tileId, { type: newType, content: '' });
        }
    }
    closeContextMenu();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{ left: contextMenu.position.x, top: contextMenu.position.y }}
    >
      {MENU_ITEMS.map((item) => (
        <button
          key={item.action}
          onClick={() => handleAction(item.action)}
          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            item.action === 'delete' ? 'text-red-500' : ''
          }`}
        >
          {item.label}
        </button>
      ))}
      <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
      <div className="px-3 py-1 text-xs text-gray-400">Change type</div>
      {(Object.keys(TILE_TYPE_LABELS) as TileType[])
        .filter((t) => t !== tile.type)
        .map((t) => (
          <button
            key={t}
            onClick={() => handleAction(`type:${t}`)}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {TILE_TYPE_LABELS[t]}
          </button>
        ))}
    </div>
  );
}
```

- [ ] **Step 4: Create BoardView shell**

Create `src/components/board-view/BoardView.tsx`:
```tsx
'use client';

import { Toolbar } from './Toolbar';
import { Breadcrumbs } from './Breadcrumbs';
import { Canvas } from './Canvas';
import { TileContextMenu } from './TileContextMenu';
import { AssetPanel } from './AssetPanel';
import { useUiStore } from '@/store/ui-store';

export function BoardView() {
  const assetPanelOpen = useUiStore((s) => s.assetPanelOpen);

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <Breadcrumbs />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        {assetPanelOpen && <AssetPanel />}
      </div>
      <TileContextMenu />
    </div>
  );
}
```

- [ ] **Step 5: Update board page to use BoardView**

Replace `src/app/board/[id]/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage } from '@/storage';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { BoardView } from '@/components/board-view/BoardView';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const loadBoard = useBoardStore((s) => s.loadBoard);

  useAutoSave();
  useKeyboardShortcuts();

  useEffect(() => {
    const id = params.id as string;
    storage.loadBoard(id).then((board) => {
      if (!board) {
        router.push('/');
        return;
      }
      loadBoard(board);
      useUiStore.getState().navigateToIndex(-1);
      setLoading(false);
    });
  }, [params.id, loadBoard, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <BoardView />;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/board-view/ src/app/board/
git commit -m "feat: add Toolbar, Breadcrumbs, ContextMenu, and BoardView shell"
```

---

## Task 15: AssetPanel

**Files:**
- Create: `src/components/board-view/AssetPanel.tsx`

- [ ] **Step 1: Create AssetPanel**

Create `src/components/board-view/AssetPanel.tsx`:
```tsx
'use client';

import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';

export function AssetPanel() {
  const tiles = useBoardStore((s) => s.board?.tiles ?? {});
  const selectTile = useUiStore((s) => s.selectTile);
  const toggleAssetPanel = useUiStore((s) => s.toggleAssetPanel);

  const assets = Object.values(tiles).filter(
    (t) => t.type === 'image' || t.type === 'pdf'
  );

  return (
    <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
        <span className="text-sm font-medium">Assets</span>
        <button
          onClick={toggleAssetPanel}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close asset panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {assets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-8">
            No media assets yet
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => selectTile(asset.id)}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-gray-400 dark:hover:border-gray-500 transition-colors aspect-square"
              >
                {asset.type === 'image' && asset.content ? (
                  <img
                    src={asset.content}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add asset panel toggle to Toolbar**

In `src/components/board-view/Toolbar.tsx`, add before the `<div className="flex-1" />` line:

```tsx
      <button
        onClick={() => useUiStore.getState().toggleAssetPanel()}
        className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Assets
      </button>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/board-view/AssetPanel.tsx src/components/board-view/Toolbar.tsx
git commit -m "feat: add AssetPanel sidebar with media thumbnails"
```

---

## Task 16: Drag & Drop File Import onto Canvas

**Files:**
- Modify: `src/components/board-view/Canvas.tsx`

- [ ] **Step 1: Add file drop handler to Canvas**

In `src/components/board-view/Canvas.tsx`, add the following state and handlers inside the `Canvas` component, before the `return`:

```tsx
  const [dragOver, setDragOver] = useState(false);
  const addTile = useBoardStore((s) => s.addTile);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const canvasRect = e.currentTarget.getBoundingClientRect();
      let offsetX = e.clientX - canvasRect.left;
      let offsetY = e.clientY - canvasRect.top;

      for (const file of files) {
        const reader = new FileReader();
        const content = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        let type: TileType = 'text';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';

        addTile({
          type,
          content: type === 'text' ? file.name : content,
          position: { x: offsetX, y: offsetY },
          parentId: currentParentId,
        });
        offsetX += 320;
      }
    },
    [addTile, currentParentId]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);
```

Add the import for `useState` and `TileType`:
```tsx
import { useCallback, useState } from 'react';
import type { TileType } from '@/storage/types';
```

Update the canvas div to include drop handlers and visual feedback:
```tsx
      <div
        className={`relative flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 ${
          dragOver ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/50 dark:bg-blue-950/30' : ''
        }`}
        onClick={handleCanvasClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
        }}
      >
```

- [ ] **Step 2: Add clipboard paste handler to keyboard shortcuts**

In `src/hooks/use-keyboard-shortcuts.ts`, add a paste handler inside the `useEffect`, after the existing `switch` block:

```typescript
      // Handle paste (outside the mod switch)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        const { editingTileId } = useUiStore.getState();
        if (editingTileId) return; // Let the tile handle its own paste

        navigator.clipboard.read().then(async (items) => {
          for (const item of items) {
            if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
              const imageType = item.types.find(t => t.startsWith('image/'))!;
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = () => {
                useBoardStore.getState().addTile({
                  type: 'image',
                  content: reader.result as string,
                  position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                  parentId: useUiStore.getState().currentParentId,
                });
              };
              reader.readAsDataURL(blob);
            }
          }
        }).catch(() => {
          // Clipboard API not available or permission denied — ignore
        });
      }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/board-view/Canvas.tsx src/hooks/use-keyboard-shortcuts.ts
git commit -m "feat: add drag-and-drop file import and clipboard paste onto canvas"
```

---

## Task 17: Example Board Data

**Files:**
- Create: `public/examples/ml-basics.json`, `public/examples/paper-breakdown.json`

- [ ] **Step 1: Create ML Basics example**

Create `public/examples/ml-basics.json`:
```json
{
  "id": "example-ml-basics",
  "title": "Machine Learning Basics",
  "tiles": {
    "t1": {
      "id": "t1",
      "parentId": null,
      "boardId": "example-ml-basics",
      "type": "text",
      "content": "<h2>Machine Learning</h2><p>Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.</p><p>Three main types:</p><ul><li>Supervised Learning</li><li>Unsupervised Learning</li><li>Reinforcement Learning</li></ul>",
      "meta": {},
      "position": { "x": 40, "y": 40 },
      "size": { "width": 360, "height": 280 },
      "zIndex": 0,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "t2": {
      "id": "t2",
      "parentId": null,
      "boardId": "example-ml-basics",
      "type": "latex",
      "content": "L(\\theta) = -\\frac{1}{n} \\sum_{i=1}^{n} [y_i \\log(h_\\theta(x_i)) + (1 - y_i) \\log(1 - h_\\theta(x_i))]",
      "meta": {},
      "position": { "x": 440, "y": 40 },
      "size": { "width": 400, "height": 160 },
      "zIndex": 1,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "t3": {
      "id": "t3",
      "parentId": null,
      "boardId": "example-ml-basics",
      "type": "code",
      "content": "import numpy as np\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.linear_model import LogisticRegression\n\n# Generate sample data\nX = np.random.randn(100, 2)\ny = (X[:, 0] + X[:, 1] > 0).astype(int)\n\n# Train/test split\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\n\n# Train model\nmodel = LogisticRegression()\nmodel.fit(X_train, y_train)\nprint(f'Accuracy: {model.score(X_test, y_test):.2f}')",
      "meta": { "language": "python" },
      "position": { "x": 440, "y": 240 },
      "size": { "width": 400, "height": 320 },
      "zIndex": 2,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "t4": {
      "id": "t4",
      "parentId": null,
      "boardId": "example-ml-basics",
      "type": "container",
      "content": "Neural Networks",
      "meta": {},
      "position": { "x": 40, "y": 360 },
      "size": { "width": 360, "height": 160 },
      "zIndex": 3,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "t5": {
      "id": "t5",
      "parentId": "t4",
      "boardId": "example-ml-basics",
      "type": "latex",
      "content": "a^{(l)} = \\sigma(W^{(l)} a^{(l-1)} + b^{(l)})",
      "meta": {},
      "position": { "x": 40, "y": 40 },
      "size": { "width": 300, "height": 120 },
      "zIndex": 0,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "t6": {
      "id": "t6",
      "parentId": "t4",
      "boardId": "example-ml-basics",
      "type": "text",
      "content": "<p>A neural network consists of layers of interconnected nodes. Each connection has a weight, and each node has a bias. The activation function introduces non-linearity.</p>",
      "meta": {},
      "position": { "x": 380, "y": 40 },
      "size": { "width": 300, "height": 160 },
      "zIndex": 1,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  },
  "rootTileIds": ["t1", "t2", "t3", "t4"],
  "gridSettings": { "snapEnabled": true, "gridSize": 20 },
  "theme": "light",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

- [ ] **Step 2: Create Paper Breakdown example**

Create `public/examples/paper-breakdown.json`:
```json
{
  "id": "example-paper-breakdown",
  "title": "Research Paper Breakdown",
  "tiles": {
    "p1": {
      "id": "p1",
      "parentId": null,
      "boardId": "example-paper-breakdown",
      "type": "text",
      "content": "<h2>Attention Is All You Need</h2><p><em>Vaswani et al., 2017</em></p><p>This paper introduces the <strong>Transformer</strong> architecture, which relies entirely on attention mechanisms, dispensing with recurrence and convolutions.</p>",
      "meta": {},
      "position": { "x": 40, "y": 40 },
      "size": { "width": 380, "height": 220 },
      "zIndex": 0,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "p2": {
      "id": "p2",
      "parentId": null,
      "boardId": "example-paper-breakdown",
      "type": "latex",
      "content": "\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V",
      "meta": {},
      "position": { "x": 460, "y": 40 },
      "size": { "width": 380, "height": 140 },
      "zIndex": 1,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "p3": {
      "id": "p3",
      "parentId": null,
      "boardId": "example-paper-breakdown",
      "type": "text",
      "content": "<h3>Key Contributions</h3><ul><li><strong>Self-attention</strong> replaces RNN/CNN for sequence modeling</li><li><strong>Multi-head attention</strong> allows attending to different representation subspaces</li><li><strong>Positional encoding</strong> injects sequence order information</li><li>Achieves SOTA on WMT translation with less training time</li></ul>",
      "meta": {},
      "position": { "x": 40, "y": 300 },
      "size": { "width": 380, "height": 240 },
      "zIndex": 2,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    "p4": {
      "id": "p4",
      "parentId": null,
      "boardId": "example-paper-breakdown",
      "type": "code",
      "content": "import torch\nimport torch.nn as nn\nimport math\n\nclass ScaledDotProductAttention(nn.Module):\n    def forward(self, Q, K, V):\n        d_k = Q.size(-1)\n        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)\n        attn = torch.softmax(scores, dim=-1)\n        return torch.matmul(attn, V)",
      "meta": { "language": "python" },
      "position": { "x": 460, "y": 220 },
      "size": { "width": 400, "height": 280 },
      "zIndex": 3,
      "gridSnap": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  },
  "rootTileIds": ["p1", "p2", "p3", "p4"],
  "gridSettings": { "snapEnabled": true, "gridSize": 20 },
  "theme": "light",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

- [ ] **Step 3: Commit**

```bash
git add public/examples/
git commit -m "feat: add example boards (ML Basics, Paper Breakdown)"
```

---

## Task 18: End-to-End Build Verification

**Files:** None — verification only.

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build completes without errors.

- [ ] **Step 3: Verify dev server**

Run:
```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
kill %1
```

Expected: HTTP 200.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build issues from integration"
```
