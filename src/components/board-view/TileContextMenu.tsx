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
  link: 'Link',
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
