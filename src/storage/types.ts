export interface Tile {
  id: string;
  parentId: string | null;
  boardId: string;
  type: 'text' | 'code' | 'latex' | 'image' | 'pdf' | 'link' | 'container';
  content: string;
  meta: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  gridSnap: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TileType = Tile['type'];

export interface Board {
  id: string;
  title: string;
  tiles: Record<string, Tile>;
  rootTileIds: string[];
  gridSettings: {
    snapEnabled: boolean;
    gridSize: number;
  };
  theme: 'light' | 'dark';
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  id: string;
  title: string;
  tileCount: number;
  updatedAt: string;
}

export interface StorageProvider {
  saveBoard(board: Board): Promise<void>;
  loadBoard(id: string): Promise<Board | null>;
  listBoards(): Promise<BoardSummary[]>;
  deleteBoard(id: string): Promise<void>;
  exportBoard(id: string): Promise<string>;
  importBoard(json: string): Promise<Board>;
}
