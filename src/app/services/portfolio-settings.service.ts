import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PriceAlert {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
}

export interface PortfolioSettings {
  defaultCurrency: string;
  notifications: {
    email: boolean;
    push: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
  };
  priceAlerts: PriceAlert[];
}

@Injectable({
  providedIn: 'root',
})
export class PortfolioSettingsService {
  private readonly API_URL = 'http://localhost:3000/api/portfolio/settings';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<PortfolioSettings> {
    return this.http.get<PortfolioSettings>(this.API_URL);
  }

  updateSettings(settings: PortfolioSettings): Observable<PortfolioSettings> {
    return this.http.put<PortfolioSettings>(this.API_URL, settings);
  }

  addPriceAlert(alert: PriceAlert): Observable<PriceAlert> {
    return this.http.post<PriceAlert>(`${this.API_URL}/alerts`, alert);
  }

  removePriceAlert(alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/alerts/${alertId}`);
  }
}
