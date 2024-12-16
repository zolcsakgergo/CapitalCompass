import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { LandingComponent } from './landing/landing.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { DashboardComponent } from './portfolio/dashboard/dashboard.component';
import { TransactionsComponent } from './portfolio/transactions/transactions.component';
import { authGuard } from './auth/auth.guard';
import { StocksComponent } from './portfolio/stocks/stocks.component';
import { CryptoComponent } from './portfolio/crypto/crypto.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'stocks', component: StocksComponent },
      { path: 'crypto', component: CryptoComponent },
      { path: 'transactions', component: TransactionsComponent },
    ],
  },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', component: LandingComponent },
  {
    path: 'profile',
    loadComponent: () =>
      import('./profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
