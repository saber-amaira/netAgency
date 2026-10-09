import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Lead, LeadInput, Listing, ListingFilters, ListingInput } from './models';

const SELECT = '*, listing_images(id, listing_id, path, position)';

/** Retire les caractères ayant un sens dans les filtres PostgREST. */
export function sanitizeSearch(q: string): string {
  return q.replace(/[,()%*\\]/g, ' ').trim();
}

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly sbs = inject(SupabaseService);
  private get sb() {
    return this.sbs.client;
  }

  coverUrl(l: Listing): string | null {
    const imgs = [...(l.listing_images ?? [])].sort((a, b) => a.position - b.position);
    return imgs.length ? this.sbs.imageUrl(imgs[0].path) : null;
  }

  async search(f: ListingFilters = {}, limit = 60): Promise<Listing[]> {
    let q = this.sb.from('listings').select(SELECT).eq('status', 'published');
    const term = sanitizeSearch(f.q ?? '');
    if (term) q = q.or(`title.ilike.%${term}%,city.ilike.%${term}%`);
    if (f.transaction_type) q = q.eq('transaction_type', f.transaction_type);
    if (f.property_type) q = q.eq('property_type', f.property_type);
    if (f.minPrice != null) q = q.gte('price', f.minPrice);
    if (f.maxPrice != null) q = q.lte('price', f.maxPrice);
    if (f.minRooms != null) q = q.gte('rooms', f.minRooms);
    const { data, error } = await q.order('published_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as Listing[];
  }

  async featured(limit = 6): Promise<Listing[]> {
    const { data, error } = await this.sb
      .from('listings')
      .select(SELECT)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as Listing[];
  }

  async get(id: string): Promise<Listing | null> {
    const { data, error } = await this.sb.from('listings').select(SELECT).eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Listing | null;
  }

  async listAll(): Promise<Listing[]> {
    const { data, error } = await this.sb
      .from('listings')
      .select(SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Listing[];
  }

  async save(input: ListingInput, id?: string): Promise<Listing> {
    const q = id
      ? this.sb.from('listings').update(input).eq('id', id)
      : this.sb.from('listings').insert(input);
    const { data, error } = await q.select(SELECT).single();
    if (error) throw error;
    return data as Listing;
  }

  async setStatus(id: string, status: 'draft' | 'published'): Promise<void> {
    const { error } = await this.sb.from('listings').update({ status }).eq('id', id);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.sb.from('listings').delete().eq('id', id);
    if (error) throw error;
  }

  async addImage(listingId: string, file: File, position: number): Promise<void> {
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${listingId}/${crypto.randomUUID()}.${ext || 'jpg'}`;
    const up = await this.sb.storage.from('listing-images').upload(path, file, { contentType: file.type });
    if (up.error) throw up.error;
    const { error } = await this.sb
      .from('listing_images')
      .insert({ listing_id: listingId, path, position });
    if (error) throw error;
  }

  async removeImage(id: string, path: string): Promise<void> {
    const { error } = await this.sb.from('listing_images').delete().eq('id', id);
    if (error) throw error;
    await this.sb.storage.from('listing-images').remove([path]);
  }

  async submitLead(lead: LeadInput): Promise<void> {
    const { error } = await this.sb.from('leads').insert(lead);
    if (error) throw error;
  }

  async leads(): Promise<Lead[]> {
    const { data, error } = await this.sb
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Lead[];
  }

  async setLeadStatus(id: string, status: Lead['status']): Promise<void> {
    const { error } = await this.sb.from('leads').update({ status }).eq('id', id);
    if (error) throw error;
  }
}
