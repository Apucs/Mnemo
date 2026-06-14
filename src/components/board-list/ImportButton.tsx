'use client';

import { openBoardFromFile } from '@/storage/file-provider';
import { storage } from '@/storage';

interface ImportButtonProps {
  onImported: () => void;
}

export function ImportButton({ onImported }: ImportButtonProps) {
  const handleImport = async () => {
    try {
      const board = await openBoardFromFile();
      await storage.saveBoard(board);
      onImported();
    } catch {
      // User cancelled file picker
    }
  };

  return (
    <button
      onClick={handleImport}
      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
    >
      Import JSON
    </button>
  );
}
