export const PORTFOLIO_ROUTES = {
  ROOT: '',
  DASHBOARD: '',
  STOCKS: 'stocks',
  CRYPTO: 'crypto',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
} as const;

export const PORTFOLIO_COMPONENTS = {
  ROOT: () =>
    import('../portfolio/portfolio.component').then(m => m.PortfolioComponent),
  DASHBOARD: () =>
    import('../portfolio/dashboard/dashboard.component').then(
      m => m.DashboardComponent,
    ),
  STOCKS: () =>
    import('../portfolio/stocks/stocks.component').then(m => m.StocksComponent),
  CRYPTO: () =>
    import('../portfolio/crypto/crypto.component').then(m => m.CryptoComponent),
  TRANSACTIONS: () =>
    import('../portfolio/transactions/transactions.component').then(
      m => m.TransactionsComponent,
    ),
  SETTINGS: () =>
    import('../portfolio/settings/portfolio-settings.component').then(
      m => m.PortfolioSettingsComponent,
    ),
} as const;
