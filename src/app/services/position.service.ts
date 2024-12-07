import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { switchMap, shareReplay, catchError, tap } from 'rxjs/operators';

export interface Position {
  id?: number;
  userId: number;
  stockName: string;
  symbol: string;
  shares: number;
  dateAcquired: string;
  type: 'BUY' | 'SELL';
  priceAtPurchase: number;
  currentPrice?: number;
  currentValue?: number;
  dailyChange?: number;
  ytdChange?: number;
  totalChange?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PositionService {
  private readonly apiUrl = `${environment.apiUrl}/positions`;
  private readonly refreshInterval = 60000; // 1 minute in ms (to respect 8 req/min limit)
  private positions$ = new BehaviorSubject<Position[]>([]);
  private summary$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    // Set up automatic refresh
    timer(0, this.refreshInterval)
      .pipe(
        switchMap(() => this.fetchPositions()),
        catchError(error => {
          console.error('Error refreshing positions:', error);
          return [];
        }),
      )
      .subscribe(positions => {
        console.log('Received updated positions:', positions);
        this.positions$.next(positions);
        this.fetchSummary().subscribe(
          summary => {
            console.log('Received updated summary:', summary);
            this.summary$.next(summary);
          },
          error => console.error('Error refreshing summary:', error),
        );
      });
  }

  private fetchPositions(): Observable<Position[]> {
    return this.http.get<Position[]>(this.apiUrl).pipe(
      tap(positions => {
        console.log('Fetched positions from API:', positions);
      }),
    );
  }

  private fetchSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/summary`).pipe(
      tap(summary => {
        console.log('Fetched summary from API:', summary);
      }),
    );
  }

  getPositions(): Observable<Position[]> {
    return this.positions$.asObservable();
  }

  addPosition(
    position: Omit<
      Position,
      | 'id'
      | 'currentPrice'
      | 'currentValue'
      | 'dailyChange'
      | 'ytdChange'
      | 'totalChange'
      | 'priceAtPurchase'
    >,
  ): Observable<Position> {
    console.log('Adding new position:', position);
    return this.http.post<Position>(this.apiUrl, position).pipe(
      tap(newPosition => {
        console.log('Successfully added position:', newPosition);
      }),
    );
  }

  getPortfolioSummary(): Observable<{
    totalValue: number;
    totalPositions: number;
    dailyChange: number;
    ytdChange: number;
  }> {
    return this.summary$.asObservable();
  }

  forceRefresh() {
    console.log('Force refreshing positions and summary');
    this.fetchPositions().subscribe(
      positions => {
        console.log('Force refresh - received positions:', positions);
        this.positions$.next(positions);
        this.fetchSummary().subscribe(
          summary => {
            console.log('Force refresh - received summary:', summary);
            this.summary$.next(summary);
          },
          error => console.error('Error refreshing summary:', error),
        );
      },
      error => console.error('Error force refreshing positions:', error),
    );
  }

  deletePosition(id: number): Observable<void> {
    console.log('Deleting position:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('Successfully deleted position:', id);
        this.forceRefresh();
      }),
    );
  }
}
