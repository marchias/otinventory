import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { Asset } from './types';

export class OtAssetInventoryDB extends Dexie {
  assets!: Table<Asset, number>;

  constructor() {
    super('OtAssetInventoryDB');   

    this.version(2).stores({
      // Index by guid, dirty flag, and client+site for querying
      assets: '++id,guid,client,site,isDirty'
    });
  }
}

export const db = new OtAssetInventoryDB();
