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
  autoArrange: (parentId: string | null) => void;
  autoArrangeUniform: (parentId: string | null) => void;
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

      autoArrange: (parentId: string | null) => {
        const board = get().board;
        if (!board) return;

        const tiles = Object.values(board.tiles).filter(
          (t) => t.parentId === parentId
        );
        if (tiles.length === 0) return;

        const gap = 20;
        const padding = 40;
        // Sort by creation time to preserve logical order
        tiles.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        // Calculate how many columns fit
        const maxWidth = Math.max(...tiles.map((t) => t.size.width));
        const viewWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
        const cols = Math.max(1, Math.floor((viewWidth - padding) / (maxWidth + gap)));

        const updatedTiles = { ...board.tiles };
        let col = 0;
        let row = 0;
        let rowHeight = 0;
        let y = padding;

        for (const tile of tiles) {
          const x = padding + col * (maxWidth + gap);
          updatedTiles[tile.id] = {
            ...tile,
            position: { x, y },
            updatedAt: new Date().toISOString(),
          };

          rowHeight = Math.max(rowHeight, tile.size.height);
          col++;
          if (col >= cols) {
            col = 0;
            row++;
            y += rowHeight + gap;
            rowHeight = 0;
          }
        }

        set({
          board: {
            ...board,
            tiles: updatedTiles,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      autoArrangeUniform: (parentId: string | null) => {
        const board = get().board;
        if (!board) return;

        const tiles = Object.values(board.tiles).filter(
          (t) => t.parentId === parentId
        );
        if (tiles.length === 0) return;

        const gap = 20;
        const padding = 40;
        const tileW = 300;
        const tileH = 200;

        tiles.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        const viewWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
        const cols = Math.max(1, Math.floor((viewWidth - padding) / (tileW + gap)));

        const updatedTiles = { ...board.tiles };
        for (let i = 0; i < tiles.length; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          updatedTiles[tiles[i].id] = {
            ...tiles[i],
            position: {
              x: padding + col * (tileW + gap),
              y: padding + row * (tileH + gap),
            },
            size: { width: tileW, height: tileH },
            updatedAt: new Date().toISOString(),
          };
        }

        set({
          board: {
            ...board,
            tiles: updatedTiles,
            updatedAt: new Date().toISOString(),
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
