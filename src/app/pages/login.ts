import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <h1>Connexion agent / admin</h1>
    <form (ngSubmit)="submit()" class="col narrow">
      <input name="email" type="email" [(ngModel)]="email" required autocomplete="username" placeholder="Email" aria-label="Email" />
      <input name="password" type="password" [(ngModel)]="password" required autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe" />
      @if (error()) { <p class="error">{{ error() }}</p> }
      <button type="submit">Se connecter</button>
    </form>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal('');
  email = '';
  password = '';

  async submit() {
    const err = await this.auth.signIn(this.email, this.password);
    if (err) return this.error.set('Identifiants invalides.');
    if (!this.auth.isStaff()) {
      await this.auth.signOut();
      return this.error.set("Ce compte n'a pas les droits agent/admin.");
    }
    void this.router.navigate(['/admin']);
  }
}
