import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LandingComponent } from './landing/landing.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login-page/login-page.component').then(
        m => m.LoginPageComponent,
      ),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./auth/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'portfolio',
    loadChildren: () =>
      import('./portfolio/portfolio.module').then(m => m.PortfolioModule),
    canActivate: [authGuard],
  },
  {
    path: 'tbsz',
    loadChildren: () => import('./tbsz/tbsz.routes').then(m => m.TBSZ_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./access-denied/access-denied.component').then(
        m => m.AccessDeniedComponent,
      ),
  },
  {
    path: '',
    component: LandingComponent,
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about.component').then(m => m.AboutComponent),
  },
  { path: '**', redirectTo: '' },
];
