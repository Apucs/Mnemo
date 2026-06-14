import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
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

  beforeEach(async () => {
    provider = new LocalStorageProvider();
    // Clear all boards
    const boards = await provider.listBoards();
    for (const b of boards) {
      await provider.deleteBoard(b.id);
    }
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
