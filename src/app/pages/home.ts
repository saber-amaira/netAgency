import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Listing } from '../core/models';
import { ListingService } from '../core/listing.service';
import { ListingCard } from './listing-card';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, ListingCard],
  template: `
    <section class="hero">
      <h1>Trouvez le bien qui vous correspond</h1>
      <form (ngSubmit)="go()" class="row">
        <select name="tx" [(ngModel)]="tx" aria-label="Type de transaction">
          <option value="">Acheter ou louer</option>
          <option value="sale">Acheter</option>
          <option value="rent">Louer</option>
        </select>
        <input name="q" [(ngModel)]="q" placeholder="Ville ou mot-clé" aria-label="Recherche" />
        <button type="submit">Rechercher</button>
      </form>
    </section>
    <section>
      <h2>Biens à la une</h2>
      @if (error()) { <p class="error">Impossible de charger les annonces.</p> }
      <div class="grid">
        @for (l of listings(); track l.id) { <app-listing-card [listing]="l" /> }
      </div>
      @if (!loading() && !error() && !listings().length) { <p>Aucune annonce publiée pour le moment.</p> }
      <p><a routerLink="/annonces">Voir toutes les annonces →</a></p>
    </section>
  `,
})
export class Home {
  private readonly svc = inject(ListingService);
  private readonly router = inject(Router);
  readonly listings = signal<Listing[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  tx = '';
  q = '';

  constructor() {
    this.svc
      .featured()
      .then((l) => this.listings.set(l))
      .catch(() => this.error.set(true))
      .finally(() => this.loading.set(false));
  }

  go() {
    void this.router.navigate(['/annonces'], {
      queryParams: { transaction_type: this.tx || null, q: this.q || null },
    });
  }
}
