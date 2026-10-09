import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly configured = !!environment.supabaseUrl && !!environment.supabaseAnonKey;
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl || 'http://localhost:54321',
    environment.supabaseAnonKey || 'public-anon-key-not-configured',
  );

  imageUrl(path: string): string {
    return this.client.storage.from('listing-images').getPublicUrl(path).data.publicUrl;
  }
}
