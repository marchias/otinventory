// src/services/syncService.ts
import { db } from '../db';
import type { Asset } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7196';

export async function getDirtyCount(): Promise<number> {
  const all = await db.assets.toArray();
  return all.filter(a => a.isDirty).length;
}

export async function syncAssets(): Promise<{
  success: boolean;
  syncedCount: number;
  error?: string;
}> {
  try {
    const dirtyAssets: Asset[] = await db.assets
      .filter(asset => asset.isDirty)
      .toArray();

    if (dirtyAssets.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    const response = await fetch(`${API_BASE_URL}/api/assets/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets: dirtyAssets })
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        syncedCount: 0,
        error: `HTTP ${response.status}: ${text}`
      };
    }

    const result: { syncedGuids: string[] } = await response.json();

    // Mark synced assets as not dirty
    await db.transaction('rw', db.assets, async () => {
      for (const guid of result.syncedGuids) {
        const asset = await db.assets.where('guid').equals(guid).first();
        if (asset && asset.id != null) {
          await db.assets.update(asset.id, { isDirty: false });
        }
      }
    });

    return {
      success: true,
      syncedCount: result.syncedGuids.length
    };
  } catch (err: any) {
    return {
      success: false,
      syncedCount: 0,
      error: err?.message ?? 'Unknown sync error'
    };
  }
}
