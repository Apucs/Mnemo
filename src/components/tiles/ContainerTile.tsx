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
