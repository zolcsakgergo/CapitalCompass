import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QuickTrade {
  assetType: 'stock' | 'crypto';
  symbol: string;
  quantity: number;
  tradeType: 'buy' | 'sell';
}

export interface TradeResponse {
  id: number;
  status: 'completed' | 'pending' | 'failed';
  message?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class QuickTradeService {
  private readonly API_URL = 'http://localhost:3000/api/trades';

  constructor(private http: HttpClient) {}

  executeTrade(trade: QuickTrade): Observable<TradeResponse> {
    return this.http.post<TradeResponse>(this.API_URL, trade);
  }

  getTradeStatus(tradeId: number): Observable<TradeResponse> {
    return this.http.get<TradeResponse>(`${this.API_URL}/${tradeId}`);
  }

  cancelTrade(tradeId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${tradeId}`);
  }
}
