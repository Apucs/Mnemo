'use client';

import { useCallback, useState } from 'react';
import type { TileType } from '@/storage/types';
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
          meta: { filename: file.name },
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectTile(null);
      closeContextMenu();
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
        <GridOverlay />
        {tiles.map((tile) => (
          <TileWrapper key={tile.id} tileId={tile.id} />
        ))}
      </div>
    </DndContext>
  );
}
