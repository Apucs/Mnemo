'use client';

import { Toolbar } from './Toolbar';
import { Breadcrumbs } from './Breadcrumbs';
import { Canvas } from './Canvas';
import { TileContextMenu } from './TileContextMenu';
import { AssetPanel } from './AssetPanel';
import { useUiStore } from '@/store/ui-store';

export function BoardView() {
  const assetPanelOpen = useUiStore((s) => s.assetPanelOpen);

  return (
    <div className="flex flex-col h-screen">
      <Toolbar />
      <Breadcrumbs />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        {assetPanelOpen && <AssetPanel />}
      </div>
      <TileContextMenu />
    </div>
  );
}
