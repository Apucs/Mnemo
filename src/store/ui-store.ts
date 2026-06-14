import { create } from 'zustand';

interface BreadcrumbEntry {
  id: string;
  title: string;
}

interface ContextMenuState {
  tileId: string;
  position: { x: number; y: number };
}

interface UiState {
  selectedTileId: string | null;
  editingTileId: string | null;
  navigationPath: BreadcrumbEntry[];
  currentParentId: string | null;
  assetPanelOpen: boolean;
  contextMenu: ContextMenuState | null;

  selectTile: (id: string | null) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  navigateInto: (id: string, title: string) => void;
  navigateToIndex: (index: number) => void;
  toggleAssetPanel: () => void;
  openContextMenu: (tileId: string, position: { x: number; y: number }) => void;
  closeContextMenu: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  selectedTileId: null,
  editingTileId: null,
  navigationPath: [],
  currentParentId: null,
  assetPanelOpen: false,
  contextMenu: null,

  selectTile: (id) => set({ selectedTileId: id }),

  startEditing: (id) => set({ editingTileId: id, selectedTileId: id }),

  stopEditing: () => set({ editingTileId: null }),

  navigateInto: (id, title) =>
    set((state) => ({
      currentParentId: id,
      navigationPath: [...state.navigationPath, { id, title }],
      selectedTileId: null,
      editingTileId: null,
    })),

  navigateToIndex: (index) =>
    set((state) => {
      if (index < 0) {
        return { currentParentId: null, navigationPath: [] };
      }
      const path = state.navigationPath.slice(0, index + 1);
      return {
        currentParentId: path[path.length - 1].id,
        navigationPath: path,
      };
    }),

  toggleAssetPanel: () =>
    set((state) => ({ assetPanelOpen: !state.assetPanelOpen })),

  openContextMenu: (tileId, position) =>
    set({ contextMenu: { tileId, position } }),

  closeContextMenu: () => set({ contextMenu: null }),
}));
