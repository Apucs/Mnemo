import { useEffect } from 'react';
import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import { storage } from '@/storage';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape exits editing mode
      if (e.key === 'Escape') {
        const { editingTileId } = useUiStore.getState();
        if (editingTileId) {
          e.preventDefault();
          useUiStore.getState().stopEditing();
          return;
        }
        // Also deselect if just selected
        useUiStore.getState().selectTile(null);
        return;
      }

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'z': {
          e.preventDefault();
          if (e.shiftKey) {
            useBoardStore.temporal.getState().redo();
          } else {
            useBoardStore.temporal.getState().undo();
          }
          break;
        }
        case 'y': {
          e.preventDefault();
          useBoardStore.temporal.getState().redo();
          break;
        }
        case 's': {
          e.preventDefault();
          const board = useBoardStore.getState().board;
          if (board) storage.saveBoard(board);
          break;
        }
        case 'g': {
          e.preventDefault();
          const board = useBoardStore.getState().board;
          if (board) {
            useBoardStore.getState().updateGridSettings({
              snapEnabled: !board.gridSettings.snapEnabled,
            });
          }
          break;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedTileId, editingTileId } = useUiStore.getState();
        if (selectedTileId && !editingTileId) {
          e.preventDefault();
          useBoardStore.getState().deleteTile(selectedTileId);
          useUiStore.getState().selectTile(null);
        }
      }

      // Handle paste
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        const { editingTileId } = useUiStore.getState();
        if (editingTileId) return;

        navigator.clipboard.read().then(async (items) => {
          for (const item of items) {
            if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
              const imageType = item.types.find(t => t.startsWith('image/'))!;
              const blob = await item.getType(imageType);
              const reader = new FileReader();
              reader.onload = () => {
                useBoardStore.getState().addTile({
                  type: 'image',
                  content: reader.result as string,
                  position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                  parentId: useUiStore.getState().currentParentId,
                });
              };
              reader.readAsDataURL(blob);
            }
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
