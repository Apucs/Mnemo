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
        onUpdate({
          content: reader.result as string,
          meta: { ...tile.meta, filename: file.name },
        });
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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {isEditing ? (
          <input
            type="text"
            value={tile.meta?.filename || ''}
            onChange={(e) => onUpdate({ meta: { ...tile.meta, filename: e.target.value } })}
            placeholder="Name this image"
            className="text-xs bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none flex-1 px-1"
          />
        ) : (
          <span className="text-xs text-gray-500 truncate">
            {tile.meta?.filename || 'Image'}
          </span>
        )}
        {isEditing && (
          <button
            onClick={handleFileSelect}
            className="text-xs text-blue-500 hover:text-blue-600 ml-2 shrink-0"
          >
            Replace
          </button>
        )}
      </div>
      <div className="flex-1 relative overflow-hidden">
        <img
          src={tile.content}
          alt={tile.meta?.alt || ''}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
