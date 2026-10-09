import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Lead, Listing } from '../core/models';
import { ListingService } from '../core/listing.service';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, DatePipe],
  template: `
    <h1>Espace agent</h1>
    <p><a routerLink="/admin/annonces/nouvelle" class="btn">+ Nouvelle annonce</a></p>
    @if (error()) { <p class="error">{{ error() }}</p> }
    <table>
      <thead><tr><th>Titre</th><th>Ville</th><th>Statut</th><th></th></tr></thead>
      <tbody>
        @for (l of listings(); track l.id) {
          <tr>
            <td>{{ l.title }}</td>
            <td>{{ l.city }}</td>
            <td>{{ l.status === 'published' ? 'Publiée' : 'Brouillon' }}</td>
            <td class="actions">
              <a [routerLink]="['/admin/annonces', l.id]">Modifier</a>
              <button type="button" (click)="toggle(l)">{{ l.status === 'published' ? 'Dépublier' : 'Publier' }}</button>
              <button type="button" class="danger" (click)="remove(l)">Supprimer</button>
            </td>
          </tr>
        }
      </tbody>
    </table>
    <h2>Demandes de contact</h2>
    <table>
      <thead><tr><th>Date</th><th>Nom</th><th>Email</th><th>Message</th><th>Statut</th></tr></thead>
      <tbody>
        @for (x of leads(); track x.id) {
          <tr>
            <td>{{ x.created_at | date: 'short' }}</td>
            <td>{{ x.name }}</td>
            <td>{{ x.email }}@if (x.phone) { <br />{{ x.phone }} }</td>
            <td class="pre">{{ x.message }}</td>
            <td>
              <select [value]="x.status" (change)="setLead(x, $any($event.target).value)" aria-label="Statut">
                <option value="new">Nouveau</option>
                <option value="contacted">Contacté</option>
                <option value="closed">Clôturé</option>
              </select>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class Admin {
  private readonly svc = inject(ListingService);
  readonly listings = signal<Listing[]>([]);
  readonly leads = signal<Lead[]>([]);
  readonly error = signal('');

  constructor() {
    void this.reload();
  }

  async reload() {
    try {
      const [l, x] = await Promise.all([this.svc.listAll(), this.svc.leads()]);
      this.listings.set(l);
      this.leads.set(x);
    } catch {
      this.error.set('Erreur de chargement.');
    }
  }

  async toggle(l: Listing) {
    try {
      await this.svc.setStatus(l.id, l.status === 'published' ? 'draft' : 'published');
      await this.reload();
    } catch {
      this.error.set('Action impossible.');
    }
  }

  async remove(l: Listing) {
    if (!confirm(`Supprimer « ${l.title} » ?`)) return;
    try {
      await this.svc.remove(l.id);
      await this.reload();
    } catch {
      this.error.set('Suppression impossible.');
    }
  }

  async setLead(x: Lead, status: Lead['status']) {
    try {
      await this.svc.setLeadStatus(x.id, status);
    } catch {
      this.error.set('Mise à jour impossible.');
    }
  }
}
