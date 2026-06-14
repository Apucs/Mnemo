import type { Board, BoardSummary, StorageProvider } from './types';

const DB_NAME = 'mnemo';
const STORE_NAME = 'boards';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class LocalStorageProvider implements StorageProvider {
  async saveBoard(board: Board): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(board);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async loadBoard(id: string): Promise<Board | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async listBoards(): Promise<BoardSummary[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const boards = request.result as Board[];
        resolve(
          boards.map((b) => ({
            id: b.id,
            title: b.title,
            tileCount: Object.keys(b.tiles).length,
            updatedAt: b.updatedAt,
          }))
        );
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBoard(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async exportBoard(id: string): Promise<string> {
    const board = await this.loadBoard(id);
    if (!board) throw new Error(`Board not found: ${id}`);
    return JSON.stringify(board);
  }

  async importBoard(json: string): Promise<Board> {
    const board = JSON.parse(json) as Board;
    await this.saveBoard(board);
    return board;
  }
}
