import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Listing, PROPERTY_LABELS, TRANSACTION_LABELS } from '../core/models';
import { ListingService } from '../core/listing.service';

@Component({
  selector: 'app-listing-card',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <a class="card" [routerLink]="['/annonces', listing().id]">
      @if (cover(); as src) {
        <img [src]="src" [alt]="listing().title" loading="lazy" />
      } @else {
        <div class="ph">Pas de photo</div>
      }
      <div class="body">
        <span class="badge">{{ tx[listing().transaction_type] }} · {{ pt[listing().property_type] }}</span>
        <h3>{{ listing().title }}</h3>
        <p class="price">
          {{ listing().price | currency: 'EUR' : 'symbol' : '1.0-0' }}
          @if (listing().transaction_type === 'rent') { /mois }
        </p>
        <p class="meta">
          {{ listing().city }}
          @if (listing().surface) { · {{ listing().surface }} m² }
          @if (listing().rooms) { · {{ listing().rooms }} p. }
        </p>
      </div>
    </a>
  `,
})
export class ListingCard {
  readonly listing = input.required<Listing>();
  readonly tx = TRANSACTION_LABELS;
  readonly pt = PROPERTY_LABELS;
  private readonly svc = inject(ListingService);
  cover() {
    return this.svc.coverUrl(this.listing());
  }
}
