import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, BehaviorSubject, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { switchMap, shareReplay, catchError, tap, map } from 'rxjs/operators';
import { StockPosition } from '../interfaces/position.interface';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly apiUrl = `${environment.apiUrl}/stocks`;
  private readonly refreshInterval = 60000; // 1 minute in ms
  private positions$ = new BehaviorSubject<StockPosition[]>([]);

  constructor(private http: HttpClient) {
    this.loadPositions();
    timer(0, this.refreshInterval)
      .pipe(
        switchMap(() =>
          this.fetchPositions().pipe(
            catchError(error => {
              console.error('Error refreshing stock positions:', error);
              return of([]);
            }),
          ),
        ),
      )
      .subscribe(positions => {
        console.log('Received updated positions:', positions);
        this.positions$.next(positions);
      });
  }

  private loadPositions() {
    this.fetchPositions().subscribe({
      next: positions => {
        console.log('Initial positions loaded:', positions);
        this.positions$.next(positions);
      },
      error: error => console.error('Error loading stock positions:', error),
    });
  }

  private formatSymbol(symbol: string): string {
    let cleanSymbol = symbol.split(':').pop() || symbol;
    return cleanSymbol.trim().toUpperCase();
  }

  private fetchPositions(): Observable<StockPosition[]> {
    console.log('Fetching stock positions from:', this.apiUrl);
    return this.http.get<StockPosition[]>(this.apiUrl).pipe(
      tap(response => {
        console.log('Raw stock API response:', response);
        console.log('Response type:', typeof response);
        if (Array.isArray(response)) {
          console.log('Number of positions:', response.length);
          response.forEach(pos => {
            console.log('Position details:', {
              id: pos.id,
              symbol: pos.symbol,
              shares: pos.shares,
              currentPrice: pos.currentPrice,
              priceAtPurchase: pos.priceAtPurchase,
            });
          });
        }
      }),
      map(positions =>
        positions.map(pos => {
          const formatted = {
            ...pos,
            type: 'stock' as const,
            symbol: this.formatSymbol(pos.symbol),
            currentPrice: Number(pos.currentPrice),
            currentValue: Number(pos.currentValue),
            dailyChange: Number(pos.dailyChange),
            ytdChange: Number(pos.ytdChange),
            totalChange: Number(pos.totalChange),
            shares: Number(pos.shares),
            priceAtPurchase: Number(pos.priceAtPurchase),
          };
          console.log(`Formatted position for ${formatted.symbol}:`, formatted);
          return formatted;
        }),
      ),
      catchError(error => {
        console.error('Error fetching stock positions:', error);
        return of([]);
      }),
    );
  }

  getPositions(): Observable<StockPosition[]> {
    return this.positions$.asObservable().pipe(
      map(positions =>
        positions.map(pos => ({
          ...pos,
          type: 'stock' as const,
          symbol: this.formatSymbol(pos.symbol),
          currentPrice: Number(pos.currentPrice),
          currentValue: Number(pos.currentValue),
          dailyChange: Number(pos.dailyChange),
          ytdChange: Number(pos.ytdChange),
          totalChange: Number(pos.totalChange),
        })),
      ),
      tap(positions => console.log('Positions being returned:', positions)),
      shareReplay(1),
    );
  }

  addPosition(
    position: Omit<
      StockPosition,
      | 'id'
      | 'type'
      | 'currentPrice'
      | 'currentValue'
      | 'dailyChange'
      | 'ytdChange'
      | 'totalChange'
    >,
  ): Observable<StockPosition> {
    const formattedPosition = {
      ...position,
      type: 'stock' as const,
      symbol: this.formatSymbol(position.symbol),
      priceAtPurchase: Number(position.priceAtPurchase),
      shares: Number(position.shares),
    };

    console.log('Adding new position:', formattedPosition);
    return this.http.post<StockPosition>(this.apiUrl, formattedPosition).pipe(
      tap({
        next: newPosition => {
          console.log('Successfully added position:', newPosition);
          const currentPositions = this.positions$.value;
          this.positions$.next([...currentPositions, newPosition]);
          this.loadPositions();
        },
        error: error => console.error('Error adding stock position:', error),
      }),
    );
  }

  deletePosition(id: number): Observable<void> {
    console.log('Deleting position with ID:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          console.log('Successfully deleted position:', id);
          const currentPositions = this.positions$.value;
          this.positions$.next(currentPositions.filter(p => p.id !== id));
          this.loadPositions();
        },
        error: error => console.error('Error deleting stock position:', error),
      }),
    );
  }

  refreshPositions() {
    console.log('Manually refreshing positions');
    this.loadPositions();
  }
}
