import { environment } from '../../environments/environment';

const BASE_URL = environment.apiUrl;

export const API_ROUTES = {
  STOCKS: `${BASE_URL}/api/stocks`,
  CRYPTO: `${BASE_URL}/api/crypto`,
  TRANSACTIONS: `${BASE_URL}/api/transactions`,
  DASHBOARD: {
    PERFORMANCE: `${BASE_URL}/api/dashboard/performance`,
    SUMMARY: `${BASE_URL}/api/dashboard/summary`,
    PORTFOLIO: `${BASE_URL}/api/dashboard/portfolio`,
  },
  AUTH: {
    LOGIN: `${BASE_URL}/api/auth/login`,
    REGISTER: `${BASE_URL}/api/auth/register`,
  },
} as const;
