'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/storage';
import { useBoardStore } from '@/store/board-store';
import type { BoardSummary } from '@/storage/types';
import { BoardCard } from './BoardCard';
import { ImportButton } from './ImportButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const EXAMPLES = [
  { file: 'ml-basics', title: 'Machine Learning Basics' },
  { file: 'paper-breakdown', title: 'Research Paper Breakdown' },
];

export function BoardList() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const router = useRouter();

  const loadBoards = async () => {
    const list = await storage.listBoards();
    setBoards(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleNewBoard = () => {
    useBoardStore.getState().createBoard('Untitled Board');
    const board = useBoardStore.getState().board!;
    storage.saveBoard(board);
    router.push(`/board/${board.id}`);
  };

  const handleDelete = async (id: string) => {
    await storage.deleteBoard(id);
    loadBoards();
  };

  const handleOpenExample = async (file: string) => {
    try {
      const res = await fetch(`/examples/${file}.json`);
      const board = await res.json();
      await storage.saveBoard(board);
      router.push(`/board/${board.id}`);
    } catch (err) {
      console.error('Failed to load example:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mnemo</h1>
        <ThemeToggle />
      </div>

      <div className="flex gap-3 mb-8">
        <button
          onClick={handleNewBoard}
          className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
        >
          + New Board
        </button>
        <ImportButton onImported={loadBoards} />
      </div>

      {boards.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Your Boards
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
          Examples
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.file}
              onClick={() => handleOpenExample(ex.file)}
              className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 hover:border-gray-500 dark:hover:border-gray-500 transition-colors text-left"
            >
              <h3 className="font-medium">{ex.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Example board
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
