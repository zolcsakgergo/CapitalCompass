import { Routes } from '@angular/router';
import {
  PORTFOLIO_ROUTES,
  PORTFOLIO_COMPONENTS,
} from '../constants/portfolio.routes';

export const PORTFOLIO_MODULE_ROUTES: Routes = [
  {
    path: PORTFOLIO_ROUTES.ROOT,
    loadComponent: PORTFOLIO_COMPONENTS.ROOT,
    children: [
      {
        path: PORTFOLIO_ROUTES.DASHBOARD,
        loadComponent: PORTFOLIO_COMPONENTS.DASHBOARD,
      },
      {
        path: PORTFOLIO_ROUTES.STOCKS,
        loadComponent: PORTFOLIO_COMPONENTS.STOCKS,
      },
      {
        path: PORTFOLIO_ROUTES.CRYPTO,
        loadComponent: PORTFOLIO_COMPONENTS.CRYPTO,
      },
      {
        path: PORTFOLIO_ROUTES.TRANSACTIONS,
        loadComponent: PORTFOLIO_COMPONENTS.TRANSACTIONS,
      },
      {
        path: PORTFOLIO_ROUTES.SETTINGS,
        loadComponent: PORTFOLIO_COMPONENTS.SETTINGS,
      },
    ],
  },
];
