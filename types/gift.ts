export interface Gift {
  id: string;
  name: string;
  inventory: number;
  reservedCount: number;
  description?: string;
  imageUrl: string;
  price: number;
  category: string;
  externalUrl?: string;
  isAvailable: boolean;
}