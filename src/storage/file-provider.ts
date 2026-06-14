import type { Board } from './types';

export function downloadBoardAsJson(board: Board): void {
  const json = JSON.stringify(board, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${board.title.replace(/\s+/g, '-').toLowerCase()}.mnemo.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function openBoardFromFile(): Promise<Board> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.mnemo.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error('No file selected'));
      const text = await file.text();
      const board = JSON.parse(text) as Board;
      resolve(board);
    };
    input.click();
  });
}
