'use client';

import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import type { Tile } from '@/storage/types';

interface CodeTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function CodeTile({ tile, isEditing, onUpdate }: CodeTileProps) {
  const codeRef = useRef<HTMLElement>(null);
  const language = (tile.meta?.language as string) || 'javascript';
  const [editValue, setEditValue] = useState(tile.content);

  useEffect(() => {
    if (!isEditing && codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [tile.content, isEditing, language]);

  useEffect(() => {
    setEditValue(tile.content);
  }, [tile.content]);

  if (isEditing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <select
            value={language}
            onChange={(e) => onUpdate({ meta: { ...tile.meta, language: e.target.value } })}
            className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5"
          >
            {['javascript', 'typescript', 'python', 'jsx', 'tsx', 'json', 'bash', 'css'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <textarea
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onUpdate({ content: e.target.value });
          }}
          className="flex-1 p-3 font-mono text-sm bg-gray-900 text-gray-100 resize-none outline-none"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <span className="text-xs text-gray-500">{language}</span>
      </div>
      <pre className="p-3 m-0 text-sm overflow-auto h-[calc(100%-2rem)]">
        <code ref={codeRef} className={`language-${language}`}>
          {tile.content}
        </code>
      </pre>
    </div>
  );
}
