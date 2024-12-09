import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { StockPosition } from '../interfaces/position.interface';
import { TransactionService } from './transaction.service';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly apiUrl = `${environment.apiUrl}/api/stocks`;

  constructor(
    private http: HttpClient,
    private transactionService: TransactionService,
  ) {}

  getPositions(): Observable<StockPosition[]> {
    return this.http.get<StockPosition[]>(this.apiUrl);
  }

  addPosition(
    position: Omit<StockPosition, 'id' | 'userId'>,
  ): Observable<StockPosition> {
    return this.http.post<StockPosition>(this.apiUrl, position).pipe(
      switchMap(newPosition => {
        // Create a transaction record
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
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
