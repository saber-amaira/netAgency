import { Component, inject, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Listing, ListingInput } from '../core/models';
import { ListingService } from '../core/listing.service';
import { SupabaseService } from '../core/supabase.service';

const EMPTY = (): ListingInput => ({
  title: '',
  description: '',
  price: 0,
  transaction_type: 'sale',
  property_type: 'apartment',
  surface: null,
  rooms: null,
  bedrooms: null,
  city: '',
  address: null,
  features: [],
  status: 'draft',
  featured: false,
});

@Component({
  selector: 'app-admin-edit',
  imports: [FormsModule],
  template: `
    <h1>{{ id() ? "Modifier l'annonce" : 'Nouvelle annonce' }}</h1>
    <form (ngSubmit)="save()" class="col narrow">
      <input name="title" [(ngModel)]="m.title" required minlength="3" maxlength="200" placeholder="Titre" aria-label="Titre" />
      <textarea name="description" [(ngModel)]="m.description" rows="6" placeholder="Description" aria-label="Description"></textarea>
      <select name="tx" [(ngModel)]="m.transaction_type" aria-label="Transaction">
        <option value="sale">Vente</option>
        <option value="rent">Location</option>
      </select>
      <select name="pt" [(ngModel)]="m.property_type" aria-label="Type de bien">
        <option value="apartment">Appartement</option>
        <option value="house">Maison</option>
        <option value="land">Terrain</option>
        <option value="commercial">Local commercial</option>
        <option value="other">Autre</option>
      </select>
      <input name="price" type="number" min="0" [(ngModel)]="m.price" required placeholder="Prix (€)" aria-label="Prix" />
      <input name="surface" type="number" min="1" [(ngModel)]="m.surface" placeholder="Surface (m²)" aria-label="Surface" />
      <input name="rooms" type="number" min="0" [(ngModel)]="m.rooms" placeholder="Pièces" aria-label="Pièces" />
      <input name="bedrooms" type="number" min="0" [(ngModel)]="m.bedrooms" placeholder="Chambres" aria-label="Chambres" />
      <input name="city" [(ngModel)]="m.city" required placeholder="Ville" aria-label="Ville" />
      <input name="address" [(ngModel)]="m.address" placeholder="Adresse" aria-label="Adresse" />
      <input name="features" [(ngModel)]="featuresText" placeholder="Équipements (séparés par des virgules)" aria-label="Équipements" />
      <label><input name="featured" type="checkbox" [(ngModel)]="m.featured" /> À la une</label>
      <label><input name="published" type="checkbox" [ngModel]="m.status === 'published'" (ngModelChange)="m.status = $event ? 'published' : 'draft'" /> Publiée</label>
      @if (error()) { <p class="error">{{ error() }}</p> }
      <button type="submit">Enregistrer</button>
    </form>
    @if (listing(); as l) {
      <h2>Photos</h2>
      <div class="gallery">
        @for (i of l.listing_images ?? []; track i.id) {
          <figure>
            <img [src]="url(i.path)" alt="" />
            <button type="button" class="danger" (click)="removeImage(i.id, i.path)">Supprimer</button>
          </figure>
        }
      </div>
      <input type="file" accept="image/*" multiple (change)="upload($any($event.target))" aria-label="Ajouter des photos" />
    }
  `,
})
export class AdminEdit {
  private readonly svc = inject(ListingService);
  private readonly sb = inject(SupabaseService);
  private readonly router = inject(Router);
  readonly id = input<string>();
  readonly listing = signal<Listing | null>(null);
  readonly error = signal('');
  m: ListingInput = EMPTY();
  featuresText = '';

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      void this.svc.get(id).then((l) => {
        if (!l) return;
        this.listing.set(l);
        const { id: _i, created_at: _c, published_at: _p, listing_images: _l, ...rest } = l;
        this.m = rest;
        this.featuresText = l.features.join(', ');
      });
    });
  }

  url(path: string) {
    return this.sb.imageUrl(path);
  }

  private num(v: unknown): number | null {
    return v === null || v === undefined || v === '' ? null : Number(v);
  }

  async save() {
    this.error.set('');
    const input: ListingInput = {
      ...this.m,
      price: Number(this.m.price),
      surface: this.num(this.m.surface),
      rooms: this.num(this.m.rooms),
      bedrooms: this.num(this.m.bedrooms),
      address: this.m.address?.trim() || null,
      features: this.featuresText.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      const saved = await this.svc.save(input, this.id());
      if (this.id()) this.listing.set(saved);
      else void this.router.navigate(['/admin/annonces', saved.id]);
    } catch {
      this.error.set('Enregistrement impossible.');
    }
  }

  async upload(el: HTMLInputElement) {
    const l = this.listing();
    if (!l || !el.files) return;
    let pos = l.listing_images?.length ?? 0;
    try {
      for (const f of Array.from(el.files)) await this.svc.addImage(l.id, f, pos++);
      this.listing.set(await this.svc.get(l.id));
    } catch {
      this.error.set("Échec de l'envoi des photos.");
    }
    el.value = '';
  }

  async removeImage(id: string, path: string) {
    const l = this.listing();
    if (!l) return;
    try {
      await this.svc.removeImage(id, path);
      this.listing.set(await this.svc.get(l.id));
    } catch {
      this.error.set('Suppression impossible.');
    }
  }
}
