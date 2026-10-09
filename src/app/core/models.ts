export type TransactionType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'other';
export type ListingStatus = 'draft' | 'published';

export interface ListingImage {
  id: string;
  listing_id: string;
  path: string;
  position: number;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  transaction_type: TransactionType;
  property_type: PropertyType;
  surface: number | null;
  rooms: number | null;
  bedrooms: number | null;
  city: string;
  address: string | null;
  features: string[];
  status: ListingStatus;
  featured: boolean;
  created_at: string;
  published_at: string | null;
  listing_images?: ListingImage[];
}

export type ListingInput = Omit<
  Listing,
  'id' | 'created_at' | 'published_at' | 'listing_images'
>;

export interface ListingFilters {
  q?: string;
  transaction_type?: TransactionType | '';
  property_type?: PropertyType | '';
  minPrice?: number | null;
  maxPrice?: number | null;
  minRooms?: number | null;
}

export interface LeadInput {
  listing_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
}

export interface Lead extends LeadInput {
  id: string;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
}

export const TRANSACTION_LABELS: Record<TransactionType, string> = { sale: 'Vente', rent: 'Location' };
export const PROPERTY_LABELS: Record<PropertyType, string> = {
  apartment: 'Appartement',
  house: 'Maison',
  land: 'Terrain',
  commercial: 'Local commercial',
  other: 'Autre',
};
