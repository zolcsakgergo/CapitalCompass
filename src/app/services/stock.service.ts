import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';
import { StockPosition } from '../interfaces/position.interface';
import { TransactionService } from './transaction.service';
import { API_ROUTES } from '../constants/api.routes';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  constructor(
    private http: HttpClient,
    private transactionService: TransactionService,
  ) {}

  getPositions(): Observable<StockPosition[]> {
    console.log('[API] Requesting stocks from:', API_ROUTES.STOCKS);
    return this.http
      .get<StockPosition[]>(API_ROUTES.STOCKS)
      .pipe(
        tap(response =>
          console.log('[API] Received stocks response:', response),
        ),
      );
  }

  addPosition(
    position: Omit<StockPosition, 'id' | 'userId'>,
  ): Observable<StockPosition> {
    return this.http.post<StockPosition>(API_ROUTES.STOCKS, position).pipe(
      switchMap(newPosition => {
        const transaction = {
          assetType: 'STOCK' as const,
          transactionType:
            position.shares > 0 ? ('BUY' as const) : ('SELL' as const),
          name: position.stockName,
          symbol: position.symbol,
          amount: Math.abs(position.shares),
          pricePerUnit: position.priceAtPurchase,
          totalValue: Math.abs(position.shares * position.priceAtPurchase),
          transactionDate: position.dateAcquired,
        };

        return this.transactionService.addTransaction(transaction).pipe(
          tap(() => {}),
          switchMap(() => Promise.resolve(newPosition)),
        );
      }),
    );
  }

  deletePosition(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ROUTES.STOCKS}/${id}`);
  }
}
