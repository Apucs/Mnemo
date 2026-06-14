'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tile } from '@/storage/types';

interface OgData {
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

interface LinkTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function VideoEmbed({ url, tile }: { url: string; tile: Tile }) {
  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);

  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}`}
        className="w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (vimeoId) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return null;
}

function isVideoUrl(url: string): boolean {
  return !!getYouTubeId(url) || !!getVimeoId(url);
}

export function LinkTile({ tile, isEditing, onUpdate }: LinkTileProps) {
  const [inputValue, setInputValue] = useState(tile.content || '');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const og: OgData | undefined = tile.meta?.og;

  useEffect(() => {
    setInputValue(tile.content || '');
  }, [tile.content]);

  const fetchOg = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      onUpdate({
        content: url,
        meta: { ...tile.meta, og: data },
      });
    } catch {
      onUpdate({
        content: url,
        meta: { ...tile.meta, og: { title: '', description: '', image: '', siteName: new URL(url).hostname, favicon: '' } },
      });
    }
    setLoading(false);
  }, [onUpdate, tile.meta]);

  const handleSubmit = () => {
    const url = inputValue.trim();
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    setInputValue(fullUrl);
    fetchOg(fullUrl);
  };

  // No URL set yet or editing — show input
  if (!tile.content || isEditing) {
    return (
      <div className="h-full flex flex-col p-3 gap-2">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Paste a URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="https://example.com"
            className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-900 outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50 shrink-0"
          >
            {loading ? '...' : 'Fetch'}
          </button>
        </div>
        {og && (
          <div className="mt-1 text-xs text-gray-400">
            Preview loaded — press Esc to see it
          </div>
        )}
      </div>
    );
  }

  // Video embed (YouTube, Vimeo)
  if (isVideoUrl(tile.content)) {
    if (playing) {
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <div style={{ height: 'calc(100% - 28px)' }}>
            <VideoEmbed url={tile.content} tile={tile} />
          </div>
          <a
            href={tile.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 h-7 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-blue-500 hover:text-blue-600 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {og?.favicon && (
              <img src={og.favicon} alt="" className="w-3 h-3" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <span className="truncate">{og?.title || tile.content}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-auto"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      );
    }

    // Show preview with play button
    const thumbnail = og?.image || (getYouTubeId(tile.content) ? `https://img.youtube.com/vi/${getYouTubeId(tile.content)}/hqdefault.jpg` : '');

    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div
          className="flex-1 min-h-0 relative bg-gray-900 cursor-pointer group"
          onClick={(e) => { e.stopPropagation(); setPlaying(true); }}
        >
          {thumbnail && (
            <img src={thumbnail} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
        </div>
        <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-1.5">
            {og?.favicon && (
              <img src={og.favicon} alt="" className="w-3 h-3 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            )}
            <span className="text-xs font-medium truncate">{og?.title || tile.content}</span>
          </div>
          {og?.siteName && (
            <span className="text-[10px] text-gray-400">{og.siteName}</span>
          )}
        </div>
      </div>
    );
  }

  // Regular link preview card
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div style={{ height: 'calc(100% - 28px)' }} className="overflow-hidden">
        {og?.image && (
          <div className="h-28 bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
            <img
              src={og.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        <div className="p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {og?.favicon && (
              <img
                src={og.favicon}
                alt=""
                className="w-3.5 h-3.5 shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {og?.siteName || new URL(tile.content).hostname}
            </span>
          </div>
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">
            {og?.title || tile.content}
          </h3>
          {og?.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
              {og.description}
            </p>
          )}
        </div>
      </div>
      <a
        href={tile.content}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 px-3 h-7 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-blue-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        Open Link
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  );
}
