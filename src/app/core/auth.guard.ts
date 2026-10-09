import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const staffGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.ready;
  return auth.isStaff() ? true : inject(Router).createUrlTree(['/connexion']);
};
