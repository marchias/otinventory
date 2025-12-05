// src/db.ts
import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Asset } from './types';

export class AssetDB extends Dexie {
  assets!: Table<Asset, number>;

  constructor() {
    super('OtAssetInventoryDB');

    this.version(1).stores({
      assets: '++id,guid,createdAt,isDirty' // indexes
    });
  }
}

export const db = new AssetDB();
