import { Component, inject, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Listing, ListingFilters } from '../core/models';
import { ListingService } from '../core/listing.service';
import { ListingCard } from './listing-card';

@Component({
  selector: 'app-listings',
  imports: [FormsModule, ListingCard],
  template: `
    <h1>Annonces</h1>
    <form class="filters" (ngSubmit)="load()">
      <input name="q" [(ngModel)]="f.q" placeholder="Ville ou mot-clé" aria-label="Recherche" />
      <select name="tx" [(ngModel)]="f.transaction_type" aria-label="Transaction">
        <option value="">Vente et location</option>
        <option value="sale">Vente</option>
        <option value="rent">Location</option>
      </select>
      <select name="pt" [(ngModel)]="f.property_type" aria-label="Type de bien">
        <option value="">Tous types</option>
        <option value="apartment">Appartement</option>
        <option value="house">Maison</option>
        <option value="land">Terrain</option>
        <option value="commercial">Local commercial</option>
        <option value="other">Autre</option>
      </select>
      <input name="min" type="number" min="0" [(ngModel)]="f.minPrice" placeholder="Prix min" aria-label="Prix min" />
      <input name="max" type="number" min="0" [(ngModel)]="f.maxPrice" placeholder="Prix max" aria-label="Prix max" />
      <input name="rooms" type="number" min="0" [(ngModel)]="f.minRooms" placeholder="Pièces min" aria-label="Pièces min" />
      <button type="submit">Filtrer</button>
    </form>
    @if (error()) { <p class="error">Impossible de charger les annonces.</p> }
    <div class="grid">
      @for (l of listings(); track l.id) { <app-listing-card [listing]="l" /> }
    </div>
    @if (!loading() && !error() && !listings().length) { <p>Aucun résultat.</p> }
  `,
})
export class Listings {
  private readonly svc = inject(ListingService);
  readonly q = input<string>();
  readonly transaction_type = input<string>();
  readonly listings = signal<Listing[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  f: ListingFilters = { q: '', transaction_type: '', property_type: '', minPrice: null, maxPrice: null, minRooms: null };

  constructor() {
    effect(() => {
      this.f.q = this.q() ?? '';
      const tx = this.transaction_type();
      this.f.transaction_type = tx === 'sale' || tx === 'rent' ? tx : '';
      void this.load();
    });
  }

  async load() {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.listings.set(await this.svc.search(this.f));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
