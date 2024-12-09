import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CryptoPosition } from '../interfaces/position.interface';
import { TransactionService } from './transaction.service';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private readonly apiUrl = `${environment.apiUrl}/crypto`;

  constructor(
    private http: HttpClient,
    private transactionService: TransactionService,
  ) {}

  getPositions(): Observable<CryptoPosition[]> {
    return this.http.get<CryptoPosition[]>(this.apiUrl);
  }

  addPosition(
    position: Omit<CryptoPosition, 'id' | 'userId'>,
  ): Observable<CryptoPosition> {
    return this.http.post<CryptoPosition>(this.apiUrl, position).pipe(
      switchMap(newPosition => {
        // Create a transaction record
        const transaction = {
          assetType: 'CRYPTO' as const,
          transactionType:
            position.amount > 0 ? ('BUY' as const) : ('SELL' as const),
          name: position.name,
          symbol: position.symbol,
          amount: Math.abs(position.amount),
          pricePerUnit: position.priceAtPurchase,
          totalValue: Math.abs(position.amount * position.priceAtPurchase),
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
