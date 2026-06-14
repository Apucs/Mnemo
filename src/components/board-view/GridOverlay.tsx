'use client';

import { useBoardStore } from '@/store/board-store';

export function GridOverlay() {
  const gridSettings = useBoardStore((s) => s.board?.gridSettings);
  if (!gridSettings?.snapEnabled) return null;

  const size = gridSettings.gridSize;

  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.07] dark:opacity-[0.1]"
      style={{
        backgroundImage: `
          linear-gradient(to right, currentColor 1px, transparent 1px),
          linear-gradient(to bottom, currentColor 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
