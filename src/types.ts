export interface Asset {
  id?: number;
  guid: string;
  name: string;
  location?: string | null;
  description?: string | null;
  imageDataUrl?: string | null;
  createdAt: string; // or Date, depending on your current type
  updatedAt: string;
  isDirty: boolean;
  isDeleted?: boolean;

  // NEW
  client: string;
  site: string;
  model?: string | null;
  macAddress?: string | null;
  IPAddress?: string | null;
}
