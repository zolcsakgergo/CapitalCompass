import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  template: `
    <h2>Transaction History</h2>
    <table mat-table [dataSource]="transactions" class="mat-elevation-z4">
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <td mat-cell *matCellDef="let transaction">{{ transaction.date }}</td>
      </ng-container>

      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef>Type</th>
        <td mat-cell *matCellDef="let transaction">{{ transaction.type }}</td>
      </ng-container>

      <ng-container matColumnDef="symbol">
        <th mat-header-cell *matHeaderCellDef>Symbol</th>
        <td mat-cell *matCellDef="let transaction">{{ transaction.symbol }}</td>
      </ng-container>

      <ng-container matColumnDef="shares">
        <th mat-header-cell *matHeaderCellDef>Shares</th>
        <td mat-cell *matCellDef="let transaction">{{ transaction.shares }}</td>
      </ng-container>

      <ng-container matColumnDef="price">
        <th mat-header-cell *matHeaderCellDef>Price</th>
        <td mat-cell *matCellDef="let transaction">
          \${{ transaction.price }}
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
    </table>
  `,
  styles: [
    `
      table {
        width: 100%;
        margin-top: 20px;
      }
    `,
  ],
})
export class TransactionsComponent {
  displayedColumns: string[] = ['date', 'type', 'symbol', 'shares', 'price'];
  transactions = [
    {
      date: '2024-01-07',
      type: 'BUY',
      symbol: 'AAPL',
      shares: 5,
      price: 185.5,
    },
    {
      date: '2024-01-06',
      type: 'SELL',
      symbol: 'GOOGL',
      shares: 2,
      price: 142.25,
    },
    {
      date: '2024-01-05',
      type: 'BUY',
      symbol: 'MSFT',
      shares: 3,
      price: 368.75,
    },
  ];
}
