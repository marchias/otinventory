export interface Asset {
  id?: number;
  guid: string;
  name: string;
  location: string;
  description?: string;
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
  isDeleted?: boolean;
}
