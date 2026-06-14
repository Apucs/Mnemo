import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from '@/store/ui-store';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({
      selectedTileId: null,
      editingTileId: null,
      navigationPath: [],
      currentParentId: null,
      assetPanelOpen: false,
      contextMenu: null,
    });
  });

  it('selects a tile', () => {
    useUiStore.getState().selectTile('tile-1');
    expect(useUiStore.getState().selectedTileId).toBe('tile-1');
  });

  it('deselects when selecting null', () => {
    useUiStore.getState().selectTile('tile-1');
    useUiStore.getState().selectTile(null);
    expect(useUiStore.getState().selectedTileId).toBeNull();
  });

  it('enters editing mode', () => {
    useUiStore.getState().startEditing('tile-1');
    expect(useUiStore.getState().editingTileId).toBe('tile-1');
    expect(useUiStore.getState().selectedTileId).toBe('tile-1');
  });

  it('stops editing', () => {
    useUiStore.getState().startEditing('tile-1');
    useUiStore.getState().stopEditing();
    expect(useUiStore.getState().editingTileId).toBeNull();
  });

  it('navigates into a container', () => {
    useUiStore.getState().navigateInto('container-1', 'My Container');
    expect(useUiStore.getState().currentParentId).toBe('container-1');
    expect(useUiStore.getState().navigationPath).toEqual([
      { id: 'container-1', title: 'My Container' },
    ]);
  });

  it('navigates back to root', () => {
    useUiStore.getState().navigateInto('c1', 'C1');
    useUiStore.getState().navigateInto('c2', 'C2');
    useUiStore.getState().navigateToIndex(-1);
    expect(useUiStore.getState().currentParentId).toBeNull();
    expect(useUiStore.getState().navigationPath).toEqual([]);
  });

  it('navigates to a specific breadcrumb', () => {
    useUiStore.getState().navigateInto('c1', 'C1');
    useUiStore.getState().navigateInto('c2', 'C2');
    useUiStore.getState().navigateInto('c3', 'C3');
    useUiStore.getState().navigateToIndex(0);
    expect(useUiStore.getState().currentParentId).toBe('c1');
    expect(useUiStore.getState().navigationPath).toHaveLength(1);
  });

  it('toggles asset panel', () => {
    useUiStore.getState().toggleAssetPanel();
    expect(useUiStore.getState().assetPanelOpen).toBe(true);
    useUiStore.getState().toggleAssetPanel();
    expect(useUiStore.getState().assetPanelOpen).toBe(false);
  });

  it('opens context menu', () => {
    useUiStore.getState().openContextMenu('tile-1', { x: 100, y: 200 });
    expect(useUiStore.getState().contextMenu).toEqual({
      tileId: 'tile-1',
      position: { x: 100, y: 200 },
    });
  });

  it('closes context menu', () => {
    useUiStore.getState().openContextMenu('tile-1', { x: 100, y: 200 });
    useUiStore.getState().closeContextMenu();
    expect(useUiStore.getState().contextMenu).toBeNull();
  });
});
