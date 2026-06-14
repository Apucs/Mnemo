'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { storage } from '@/storage';
import { downloadBoardAsJson } from '@/storage/file-provider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { TileType } from '@/storage/types';

const TILE_TYPES: { type: TileType; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'code', label: 'Code' },
  { type: 'latex', label: 'LaTeX' },
  { type: 'image', label: 'Image' },
  { type: 'pdf', label: 'PDF' },
  { type: 'link', label: 'Link' },
  { type: 'container', label: 'Container' },
];

export function Toolbar() {
  const board = useBoardStore((s) => s.board);
  const addTile = useBoardStore((s) => s.addTile);
  const renameBoard = useBoardStore((s) => s.renameBoard);
  const currentParentId = useUiStore((s) => s.currentParentId);
  const snapEnabled = board?.gridSettings.snapEnabled ?? true;
  const updateGridSettings = useBoardStore((s) => s.updateGridSettings);
  const autoArrange = useBoardStore((s) => s.autoArrange);
  const autoArrangeUniform = useBoardStore((s) => s.autoArrangeUniform);
  const router = useRouter();

  const handleAddTile = (type: TileType) => {
    addTile({
      type,
      content: '',
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      parentId: currentParentId,
    });
  };

  const handleExport = () => {
    if (board) downloadBoardAsJson(board);
  };

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [arrangeOpen, setArrangeOpen] = useState(false);

  const handleSave = async () => {
    if (!board) return;
    try {
      await storage.saveBoard(board);
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch {
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <button
        onClick={() => router.push('/')}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Back to home"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <input
        type="text"
        value={board?.title ?? ''}
        onChange={(e) => renameBoard(e.target.value)}
        className="font-semibold bg-transparent border-none outline-none px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900 focus:bg-gray-50 dark:focus:bg-gray-900 transition-colors"
      />

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

      <div className="flex gap-1">
        {TILE_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => handleAddTile(type)}
            className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

      <button
        onClick={() => updateGridSettings({ snapEnabled: !snapEnabled })}
        className={`px-2.5 py-1 text-sm rounded transition-colors ${
          snapEnabled
            ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        Snap {snapEnabled ? 'On' : 'Off'}
      </button>

      <div className="relative">
        <button
          onClick={() => setArrangeOpen((v) => !v)}
          className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
        >
          Arrange
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {arrangeOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
            <button
              onClick={() => { autoArrange(currentParentId); setArrangeOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Arrange (keep sizes)
            </button>
            <button
              onClick={() => { autoArrangeUniform(currentParentId); setArrangeOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Arrange uniform
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => useUiStore.getState().toggleAssetPanel()}
        className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Assets
      </button>

      <div className="flex-1" />

      <button
        onClick={handleSave}
        className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Save
      </button>
      {saveStatus && (
        <span className={`text-xs px-2 py-0.5 rounded ${
          saveStatus === 'Saved'
            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950'
            : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950'
        }`}>
          {saveStatus}
        </span>
      )}
      <button
        onClick={handleExport}
        className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Export
      </button>
      <ThemeToggle />
    </div>
  );
}
