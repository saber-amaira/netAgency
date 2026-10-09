import { Routes } from '@angular/router';
import { staffGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', title: 'netAgency', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  { path: 'annonces', title: 'Annonces', loadComponent: () => import('./pages/listings').then((m) => m.Listings) },
  { path: 'annonces/:id', title: 'Annonce', loadComponent: () => import('./pages/listing-detail').then((m) => m.ListingDetail) },
  { path: 'contact', title: 'Contact', loadComponent: () => import('./pages/contact').then((m) => m.Contact) },
  { path: 'connexion', title: 'Connexion', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  { path: 'admin', canActivate: [staffGuard], title: 'Espace agent', loadComponent: () => import('./pages/admin').then((m) => m.Admin) },
  { path: 'admin/annonces/nouvelle', canActivate: [staffGuard], loadComponent: () => import('./pages/admin-edit').then((m) => m.AdminEdit) },
  { path: 'admin/annonces/:id', canActivate: [staffGuard], loadComponent: () => import('./pages/admin-edit').then((m) => m.AdminEdit) },
  { path: '**', redirectTo: '' },
];
