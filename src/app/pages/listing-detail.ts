import { Component, inject, input, signal, effect } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Listing, PROPERTY_LABELS, TRANSACTION_LABELS } from '../core/models';
import { ListingService } from '../core/listing.service';
import { SupabaseService } from '../core/supabase.service';

@Component({
  selector: 'app-listing-detail',
  imports: [CurrencyPipe, FormsModule],
  template: `
    @if (listing(); as l) {
      <h1>{{ l.title }}</h1>
      <p class="meta">{{ l.city }}@if (l.address) { , {{ l.address }} }</p>
      <p class="price">
        {{ l.price | currency: 'EUR' : 'symbol' : '1.0-0' }}
        @if (l.transaction_type === 'rent') { /mois }
      </p>
      <div class="gallery">
        @for (u of images(); track u) { <img [src]="u" [alt]="l.title" loading="lazy" /> }
      </div>
      <div class="two">
        <section>
          <h2>Description</h2>
          <p class="pre">{{ l.description }}</p>
          <h2>Caractéristiques</h2>
          <ul>
            <li>{{ tx[l.transaction_type] }} · {{ pt[l.property_type] }}</li>
            @if (l.surface) { <li>Surface : {{ l.surface }} m²</li> }
            @if (l.rooms != null) { <li>Pièces : {{ l.rooms }}</li> }
            @if (l.bedrooms != null) { <li>Chambres : {{ l.bedrooms }}</li> }
            @for (f of l.features; track f) { <li>{{ f }}</li> }
          </ul>
        </section>
        <section>
          <h2>Contacter l'agence</h2>
          @if (sent()) {
            <p class="ok">Merci ! Votre demande a bien été envoyée.</p>
          } @else {
            <form (ngSubmit)="submit()" class="col">
              <input name="name" [(ngModel)]="form.name" required minlength="2" maxlength="120" placeholder="Nom" aria-label="Nom" />
              <input name="email" type="email" [(ngModel)]="form.email" required maxlength="254" placeholder="Email" aria-label="Email" />
              <input name="phone" [(ngModel)]="form.phone" maxlength="30" placeholder="Téléphone (optionnel)" aria-label="Téléphone" />
              <textarea name="message" [(ngModel)]="form.message" required maxlength="2000" rows="5" placeholder="Votre message" aria-label="Message"></textarea>
              @if (error()) { <p class="error">Envoi impossible, vérifiez les champs.</p> }
              <button type="submit">Envoyer</button>
            </form>
          }
        </section>
      </div>
    } @else if (loaded()) {
      <p>Annonce introuvable.</p>
    }
  `,
})
export class ListingDetail {
  private readonly svc = inject(ListingService);
  private readonly sb = inject(SupabaseService);
  readonly id = input.required<string>();
  readonly listing = signal<Listing | null>(null);
  readonly loaded = signal(false);
  readonly sent = signal(false);
  readonly error = signal(false);
  readonly tx = TRANSACTION_LABELS;
  readonly pt = PROPERTY_LABELS;
  form = { name: '', email: '', phone: '', message: '' };

  constructor() {
    effect(() => {
      const id = this.id();
      this.svc
        .get(id)
        .then((l) => this.listing.set(l))
        .catch(() => this.listing.set(null))
        .finally(() => this.loaded.set(true));
    });
  }

  images(): string[] {
    return [...(this.listing()?.listing_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => this.sb.imageUrl(i.path));
  }

  async submit() {
    this.error.set(false);
    try {
      await this.svc.submitLead({
        listing_id: this.listing()?.id ?? null,
        name: this.form.name.trim(),
        email: this.form.email.trim(),
        phone: this.form.phone.trim() || null,
        message: this.form.message.trim(),
      });
      this.sent.set(true);
    } catch {
      this.error.set(true);
    }
  }
}
