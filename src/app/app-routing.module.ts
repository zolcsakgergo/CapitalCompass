import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { LandingComponent } from './landing/landing.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';

import { TransactionsComponent } from './portfolio/transactions/transactions.component';
import { authGuard } from './auth/auth.guard';
import { PositionsComponent } from './portfolio/positions/positions.component';
import { DashboardComponent } from './portfolio/dashboard/dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [authGuard],
    children: [
      { path: 'positions', component: PositionsComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: '', component: DashboardComponent },
    ],
  },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', component: LandingComponent },
  { path: '**', redirectTo: '' },
];
