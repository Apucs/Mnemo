import { useEffect, useRef } from 'react';
import { useBoardStore } from '@/store/board-store';
import { storage } from '@/storage';

export function useAutoSave(delayMs = 500) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = useBoardStore.subscribe((state) => {
      if (!state.board) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        storage.saveBoard(state.board!);
      }, delayMs);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delayMs]);
}
