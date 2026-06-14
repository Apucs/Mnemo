'use client';

import { useBoardStore } from '@/store/board-store';
import { useUiStore } from '@/store/ui-store';
import type { Tile } from '@/storage/types';

const TYPE_ICONS: Record<string, string> = {
  text: 'T',
  code: '</>',
  latex: 'fx',
  image: 'IMG',
  pdf: 'PDF',
  link: '🔗',
  container: 'DIR',
};

function getAssetLabel(asset: Tile): string {
  switch (asset.type) {
    case 'text': {
      const text = asset.content?.replace(/<[^>]*>/g, '').trim();
      return text?.slice(0, 30) || 'Empty text';
    }
    case 'code':
      return asset.meta?.language || 'Code';
    case 'latex':
      return asset.content?.slice(0, 30) || 'Empty equation';
    case 'image':
      return asset.meta?.filename || (asset.content ? 'Image' : 'No image');
    case 'pdf':
      return asset.meta?.filename || (asset.content ? 'PDF Document' : 'No PDF');
    case 'link':
      return asset.meta?.og?.title || asset.content || 'Link';
    case 'container':
      return asset.content || 'Container';
    default:
      return asset.type;
  }
}

function AssetThumb({ asset }: { asset: Tile }) {
  const selectTile = useUiStore((s) => s.selectTile);

  if (asset.type === 'image' && asset.content) {
    return (
      <button
        onClick={() => selectTile(asset.id)}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors aspect-square"
      >
        <img src={asset.content} alt="" className="w-full h-full object-cover" />
      </button>
    );
  }

  return (
    <button
      onClick={() => selectTile(asset.id)}
      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors aspect-square flex flex-col items-center justify-center gap-1.5 p-2"
    >
      <span className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500">
        {TYPE_ICONS[asset.type] || '?'}
      </span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-full leading-tight text-center">
        {getAssetLabel(asset)}
      </span>
    </button>
  );
}

export function AssetPanel() {
  const tiles = useBoardStore((s) => s.board?.tiles ?? {});
  const toggleAssetPanel = useUiStore((s) => s.toggleAssetPanel);

  const mediaAssets = Object.values(tiles).filter(
    (t) => t.type === 'image' || t.type === 'pdf'
  );
  const otherAssets = Object.values(tiles).filter(
    (t) => t.type !== 'image' && t.type !== 'pdf'
  );

  return (
    <div className="w-64 min-h-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800">
        <span className="text-sm font-medium">Assets</span>
        <button
          onClick={toggleAssetPanel}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close asset panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {mediaAssets.length === 0 && otherAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300 dark:text-gray-700 mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <p className="text-sm text-gray-400 dark:text-gray-500">No assets yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Add tiles to your board to see them here</p>
          </div>
        ) : (
          <>
            {mediaAssets.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">Media</p>
                <div className="grid grid-cols-2 gap-2">
                  {mediaAssets.map((asset) => (
                    <AssetThumb key={asset.id} asset={asset} />
                  ))}
                </div>
              </div>
            )}
            {otherAssets.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-2">Tiles</p>
                <div className="grid grid-cols-2 gap-2">
                  {otherAssets.map((asset) => (
                    <AssetThumb key={asset.id} asset={asset} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
