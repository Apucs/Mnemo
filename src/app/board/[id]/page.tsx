'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage } from '@/storage';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { BoardView } from '@/components/board-view/BoardView';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const loadBoard = useBoardStore((s) => s.loadBoard);

  useAutoSave();
  useKeyboardShortcuts();

  useEffect(() => {
    const id = params.id as string;
    storage.loadBoard(id).then((board) => {
      if (!board) {
        router.push('/');
        return;
      }
      loadBoard(board);
      useUiStore.getState().navigateToIndex(-1);
      setLoading(false);
    });
  }, [params.id, loadBoard, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return <BoardView />;
}
