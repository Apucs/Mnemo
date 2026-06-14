'use client';

import { useUiStore } from '@/store/ui-store';

export function Breadcrumbs() {
  const navigationPath = useUiStore((s) => s.navigationPath);
  const navigateToIndex = useUiStore((s) => s.navigateToIndex);

  if (navigationPath.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
      <button
        onClick={() => navigateToIndex(-1)}
        className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        Root
      </button>
      {navigationPath.map((entry, i) => (
        <span key={entry.id} className="flex items-center gap-1">
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <button
            onClick={() => navigateToIndex(i)}
            className={`hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
              i === navigationPath.length - 1 ? 'text-gray-900 dark:text-gray-100 font-medium' : ''
            }`}
          >
            {entry.title}
          </button>
        </span>
      ))}
    </div>
  );
}
