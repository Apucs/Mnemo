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
