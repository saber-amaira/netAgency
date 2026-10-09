import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListingService } from '../core/listing.service';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  template: `
    <h1>Contact</h1>
    @if (sent()) {
      <p class="ok">Merci ! Nous vous recontacterons rapidement.</p>
    } @else {
      <form (ngSubmit)="submit()" class="col narrow">
        <input name="name" [(ngModel)]="form.name" required minlength="2" maxlength="120" placeholder="Nom" aria-label="Nom" />
        <input name="email" type="email" [(ngModel)]="form.email" required maxlength="254" placeholder="Email" aria-label="Email" />
        <input name="phone" [(ngModel)]="form.phone" maxlength="30" placeholder="Téléphone (optionnel)" aria-label="Téléphone" />
        <textarea name="message" [(ngModel)]="form.message" required maxlength="2000" rows="6" placeholder="Votre projet" aria-label="Message"></textarea>
        @if (error()) { <p class="error">Envoi impossible, vérifiez les champs.</p> }
        <button type="submit">Envoyer</button>
      </form>
    }
  `,
})
export class Contact {
  private readonly svc = inject(ListingService);
  readonly sent = signal(false);
  readonly error = signal(false);
  form = { name: '', email: '', phone: '', message: '' };

  async submit() {
    this.error.set(false);
    try {
      await this.svc.submitLead({
        listing_id: null,
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
