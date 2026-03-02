import { get, set, del } from 'idb-keyval';

export interface SavedSession {
  id: string;
  fileName: string;
  updatedAt: number;
  step: 'UPLOAD' | 'OPTIMIZE' | 'PROCESS' | 'RESULT';
  optimizedImages: string[];
  menuData: any | null;
}

export interface SessionMetadata {
  id: string;
  fileName: string;
  updatedAt: number;
  step: string;
  pageCount: number;
  hasData: boolean;
  thumbnail?: string;
}

const INDEX_KEY = 'menu-magic-sessions-index';

export async function saveSession(session: SavedSession): Promise<void> {
  try {
    // Save the full session data
    await set(`session-${session.id}`, session);
    
    // Update the index (metadata only, no images/data to keep it fast)
    const index = await get<SessionMetadata[]>(INDEX_KEY) || [];
    const existingIndex = index.findIndex(s => s.id === session.id);
    
    const metadata: SessionMetadata = {
      id: session.id,
      fileName: session.fileName,
      updatedAt: session.updatedAt,
      step: session.step,
      pageCount: session.optimizedImages.length,
      hasData: !!session.menuData,
      thumbnail: session.optimizedImages.length > 0 ? session.optimizedImages[0] : undefined
    };
    
    if (existingIndex >= 0) {
      index[existingIndex] = metadata;
    } else {
      index.push(metadata);
    }
    
    // Sort by most recent
    index.sort((a, b) => b.updatedAt - a.updatedAt);
    await set(INDEX_KEY, index);
  } catch (error) {
    console.error('Failed to save session to IndexedDB:', error);
  }
}

export async function getSession(id: string): Promise<SavedSession | undefined> {
  return await get<SavedSession>(`session-${id}`);
}

export async function getAllSessionsMetadata(): Promise<SessionMetadata[]> {
  return await get<SessionMetadata[]>(INDEX_KEY) || [];
}

export async function deleteSession(id: string): Promise<void> {
  await del(`session-${id}`);
  const index = await get<SessionMetadata[]>(INDEX_KEY) || [];
  await set(INDEX_KEY, index.filter(s => s.id !== id));
}
