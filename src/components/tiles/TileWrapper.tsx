'use client';

import { useCallback, useRef, useState, lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTileById } from '@/hooks/use-tile';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import type { Tile } from '@/storage/types';

interface TileContentProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

const TextTile = lazy(() => import('./TextTile').then(m => ({ default: m.TextTile })));
const CodeTile = lazy(() => import('./CodeTile').then(m => ({ default: m.CodeTile })));
const LatexTile = lazy(() => import('./LatexTile').then(m => ({ default: m.LatexTile })));
const ImageTile = lazy(() => import('./ImageTile').then(m => ({ default: m.ImageTile })));
const PdfTile = lazy(() => import('./PdfTile').then(m => ({ default: m.PdfTile })));
const LinkTile = lazy(() => import('./LinkTile').then(m => ({ default: m.LinkTile })));
const ContainerTile = lazy(() => import('./ContainerTile').then(m => ({ default: m.ContainerTile })));

const TILE_COMPONENTS: Record<string, ComponentType<TileContentProps>> = {
  text: TextTile,
  code: CodeTile,
  latex: LatexTile,
  image: ImageTile,
  pdf: PdfTile,
  link: LinkTile,
  container: ContainerTile,
};

interface TileWrapperProps {
  tileId: string;
}

export function TileWrapper({ tileId }: TileWrapperProps) {
  const tile = useTileById(tileId);
  const updateTile = useBoardStore((s) => s.updateTile);
  const deleteTile = useBoardStore((s) => s.deleteTile);
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
        isEditing
          ? 'border-green-500 shadow-md ring-1 ring-green-500/20'
          : isSelected
            ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${resizing ? 'select-none' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        selectTile(tileId);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (isEditing) return;
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
              onUpdate={(updates: Partial<Tile>) => updateTile(tileId, updates)}
            />
          )}
        </Suspense>
      </div>

      {isEditing && (
        <div className="absolute -top-6 left-0 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded-t border border-b-0 border-green-500">
          Editing — Esc to exit
        </div>
      )}

      {isSelected && (
        <>
          <button
            className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              deleteTile(tileId);
              selectTile(null);
            }}
            aria-label="Delete tile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
            onPointerDown={(e) => handleResizeStart(e, 'se')}
          />
        </>
      )}
    </div>
  );
}
