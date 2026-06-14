'use client';

import Link from 'next/link';
import type { BoardSummary } from '@/storage/types';

interface BoardCardProps {
  board: BoardSummary;
  onDelete: (id: string) => void;
}

export function BoardCard({ board, onDelete }: BoardCardProps) {
  return (
    <div className="group relative border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-400 dark:hover:border-gray-600 transition-colors">
      <Link href={`/board/${board.id}`} className="block">
        <h3 className="font-medium text-lg truncate">{board.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {board.tileCount} tile{board.tileCount !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {new Date(board.updatedAt).toLocaleDateString()}
        </p>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onDelete(board.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-all"
        aria-label="Delete board"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  );
}
