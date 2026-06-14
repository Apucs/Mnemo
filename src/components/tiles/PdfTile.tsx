'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { Tile } from '@/storage/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfTileProps {
  tile: Tile;
  isEditing: boolean;
  onUpdate: (updates: Partial<Tile>) => void;
}

export function PdfTile({ tile, isEditing, onUpdate }: PdfTileProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({
          content: reader.result as string,
          meta: { ...tile.meta, filename: file.name },
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [onUpdate]);

  if (!tile.content) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:text-gray-500 transition-colors"
        onClick={handleFileSelect}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span className="text-sm">Click to add PDF</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="text-xs px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
        >
          Prev
        </button>
        {isEditing ? (
          <input
            type="text"
            value={tile.meta?.filename || ''}
            onChange={(e) => onUpdate({ meta: { ...tile.meta, filename: e.target.value } })}
            placeholder="Name this PDF"
            className="text-xs text-center bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none max-w-[120px] px-1"
          />
        ) : (
          <span className="text-xs text-gray-500 truncate max-w-[120px]" title={tile.meta?.filename}>
            {tile.meta?.filename || 'PDF'} — {currentPage}/{numPages}
          </span>
        )}
        <button
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          className="text-xs px-2 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
        >
          Next
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-start justify-center p-2">
        <Document
          file={tile.content}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        >
          <Page
            pageNumber={currentPage}
            width={tile.size.width - 20}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}
