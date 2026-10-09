import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type Role = 'visitor' | 'agent' | 'admin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService).client;
  readonly userId = signal<string | null>(null);
  readonly role = signal<Role | null>(null);
  readonly isStaff = computed(() => this.role() === 'agent' || this.role() === 'admin');
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const { data } = await this.sb.auth.getSession();
    await this.apply(data.session?.user.id ?? null);
    this.sb.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void this.apply(session?.user.id ?? null));
    });
  }

  private async apply(id: string | null): Promise<void> {
    this.userId.set(id);
    if (!id) {
      this.role.set(null);
      return;
    }
    const { data } = await this.sb.from('profiles').select('role').eq('id', id).maybeSingle();
    this.role.set((data?.role as Role) ?? 'visitor');
  }

  async signIn(email: string, password: string): Promise<string | null> {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    await this.apply(data.user.id);
    return null;
  }

  async signOut(): Promise<void> {
    await this.sb.auth.signOut();
    await this.apply(null);
  }
}
