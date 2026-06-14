import { useShallow } from 'zustand/react/shallow';
import { useBoardStore } from '@/store/board-store';
import type { Tile } from '@/storage/types';

export function useTileById(id: string): Tile | undefined {
  return useBoardStore((state) => state.board?.tiles[id]);
}

const EMPTY_TILES: Tile[] = [];

export function useTilesForParent(parentId: string | null): Tile[] {
  return useBoardStore(
    useShallow((state) => {
      if (!state.board) return EMPTY_TILES;
      return Object.values(state.board.tiles).filter(
        (t) => t.parentId === parentId
      );
    })
  );
}
