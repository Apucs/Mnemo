import { LocalStorageProvider } from './local-storage-provider';
import type { StorageProvider } from './types';

export const storage: StorageProvider = new LocalStorageProvider();
