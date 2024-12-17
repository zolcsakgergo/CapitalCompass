import { Routes } from '@angular/router';

export const PORTFOLIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./portfolio.component').then(m => m.PortfolioComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            m => m.DashboardComponent,
          ),
      },
      {
        path: 'stocks',
        loadComponent: () =>
          import('./stocks/stocks.component').then(m => m.StocksComponent),
      },
      {
        path: 'crypto',
        loadComponent: () =>
          import('./crypto/crypto.component').then(m => m.CryptoComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./transactions/transactions.component').then(
            m => m.TransactionsComponent,
          ),
      },
    ],
  },
];
