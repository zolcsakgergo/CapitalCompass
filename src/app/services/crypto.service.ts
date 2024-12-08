import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { switchMap, shareReplay, catchError, tap, map } from 'rxjs/operators';
import { CryptoPosition } from '../interfaces/position.interface';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private readonly apiUrl = `${environment.apiUrl}/crypto`;
  private readonly refreshInterval = 60000; // 1 minute in ms
  private positions$ = new BehaviorSubject<CryptoPosition[]>([]);

  constructor(private http: HttpClient) {
    this.loadPositions();
    timer(this.refreshInterval, this.refreshInterval)
      .pipe(
        switchMap(() => this.fetchPositions()),
        catchError(error => {
          console.error('Error refreshing crypto positions:', error);
          return [];
        }),
      )
      .subscribe(positions => {
        this.positions$.next(positions);
      });
  }

  private loadPositions() {
    this.fetchPositions().subscribe({
      next: positions => this.positions$.next(positions),
      error: error => console.error('Error loading crypto positions:', error),
    });
  }

  private formatSymbol(symbol: string): string {
    return symbol.trim().toUpperCase();
  }

  private fetchPositions(): Observable<CryptoPosition[]> {
    return this.http.get<CryptoPosition[]>(this.apiUrl).pipe(
      map(positions =>
        positions.map(pos => ({
          ...pos,
          type: 'crypto' as const,
          symbol: this.formatSymbol(pos.symbol),
          currentPrice: Number(pos.currentPrice) || 0,
          currentValue: Number(pos.currentValue) || 0,
          totalChange: Number(pos.totalChange) || 0,
          amount: Number(pos.amount) || 0,
          priceAtPurchase: Number(pos.priceAtPurchase) || 0,
        })),
      ),
      catchError(error => {
        console.error('Error fetching crypto positions:', error);
        return [];
      }),
    );
  }

  getPositions(): Observable<CryptoPosition[]> {
    return this.positions$.asObservable().pipe(
      map(positions =>
        positions.map(pos => ({
          ...pos,
          type: 'crypto' as const,
          symbol: this.formatSymbol(pos.symbol),
          currentPrice: Number(pos.currentPrice) || 0,
          currentValue: Number(pos.currentValue) || 0,
          totalChange: Number(pos.totalChange) || 0,
        })),
      ),
      shareReplay(1),
    );
  }

  addPosition(
    position: Omit<
      CryptoPosition,
      'id' | 'type' | 'currentPrice' | 'currentValue' | 'totalChange'
    >,
  ): Observable<CryptoPosition> {
    const formattedPosition = {
      ...position,
      type: 'crypto' as const,
      symbol: this.formatSymbol(position.symbol),
      priceAtPurchase: Number(position.priceAtPurchase),
      amount: Number(position.amount),
    };

    return this.http.post<CryptoPosition>(this.apiUrl, formattedPosition).pipe(
      tap({
        next: newPosition => {
          const currentPositions = this.positions$.value;
          this.positions$.next([...currentPositions, newPosition]);
          this.loadPositions();
        },
        error: error => console.error('Error adding crypto position:', error),
      }),
    );
  }

  deletePosition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          const currentPositions = this.positions$.value;
          this.positions$.next(currentPositions.filter(p => p.id !== id));
          this.loadPositions();
        },
        error: error => console.error('Error deleting crypto position:', error),
      }),
    );
  }

  refreshPositions() {
    this.loadPositions();
  }
}
