import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { LandingComponent } from './landing/landing.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { DashboardComponent } from './portfolio/dashboard/dashboard.component';
import { PositionsComponent } from './portfolio/positions/positions.component';
import { TransactionsComponent } from './portfolio/transactions/transactions.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'positions', component: PositionsComponent },
      { path: 'transactions', component: TransactionsComponent },
    ],
  },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', component: LandingComponent },
  { path: '**', redirectTo: '' },
];
