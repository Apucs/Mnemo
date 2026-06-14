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
