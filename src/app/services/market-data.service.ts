import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, timer } from 'rxjs';
import { map, throttleTime } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface QuoteResponse {
  symbol: string;
  price: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class MarketDataService {
  private readonly apiKey = environment.twelveDataApiKey;
  private readonly baseUrl = 'https://api.twelvedata.com';
  private requestCount = 0;
  private lastRequestTime = Date.now();
  private readonly requestLimit = 8;
  private readonly timeWindow = 60000;

  constructor(private http: HttpClient) {}

  private canMakeRequest(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime >= this.timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
      return true;
    }
    return this.requestCount < this.requestLimit;
  }

  private incrementRequestCount() {
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  getRealTimePrice(symbol: string): Observable<number> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.incrementRequestCount();
    return this.http
      .get<QuoteResponse>(
        `${this.baseUrl}/price?symbol=${symbol}&apikey=${this.apiKey}`,
      )
      .pipe(map(response => parseFloat(response.price)));
  }

  // Get multiple stock prices in one request to save on rate limit
  getBatchQuotes(symbols: string[]): Observable<Map<string, number>> {
    if (!this.canMakeRequest()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.incrementRequestCount();
    const symbolString = symbols.join(',');

    return this.http
      .get<any>(
        `${this.baseUrl}/price?symbol=${symbolString}&apikey=${this.apiKey}`,
      )
      .pipe(
        map(response => {
          const priceMap = new Map<string, number>();
          if (symbols.length === 1) {
            // Single symbol response
            priceMap.set(symbols[0], parseFloat(response.price));
          } else {
            // Multiple symbols response
            Object.entries(response).forEach(
              ([symbol, data]: [string, any]) => {
                priceMap.set(symbol, parseFloat(data.price));
              },
            );
          }
          return priceMap;
        }),
      );
  }

  setupPriceUpdates(symbols: string[]): Observable<Map<string, number>> {
    const subject = new Subject<Map<string, number>>();

    timer(0, 15000)
      .pipe(throttleTime(this.timeWindow / this.requestLimit))
      .subscribe(() => {
        if (this.canMakeRequest()) {
          this.getBatchQuotes(symbols).subscribe(
            prices => subject.next(prices),
            error => subject.error(error),
          );
        }
      });

    return subject.asObservable();
  }
}
