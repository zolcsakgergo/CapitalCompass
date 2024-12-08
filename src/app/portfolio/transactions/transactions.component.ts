import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { StockService } from '../../services/stock.service';
import { CryptoService } from '../../services/crypto.service';
import {
  StockPosition,
  CryptoPosition,
} from '../../interfaces/position.interface';
import { forkJoin } from 'rxjs';

interface Transaction {
  date: string;
  type: string;
  symbol: string;
  amount: number;
  price: number;
  total: number;
  assetType: 'stock' | 'crypto';
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
})
export class TransactionsComponent implements OnInit {
  displayedColumns: string[] = [
    'date',
    'type',
    'symbol',
    'amount',
    'price',
    'total',
  ];
  transactions: Transaction[] = [];

  constructor(
    private stockService: StockService,
    private cryptoService: CryptoService,
  ) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    // Load both stock and crypto transactions
    forkJoin({
      stocks: this.stockService.getPositions(),
      cryptos: this.cryptoService.getPositions(),
    }).subscribe({
      next: ({ stocks, cryptos }) => {
        const stockTransactions: Transaction[] = stocks.map(position => ({
          date: position.dateAcquired,
          type: 'BUY',
          symbol: position.symbol,
          amount: position.shares,
          price: position.priceAtPurchase,
          total: position.shares * position.priceAtPurchase,
          assetType: 'stock',
        }));

        const cryptoTransactions: Transaction[] = cryptos.map(position => ({
          date: position.dateAcquired,
          type: 'BUY',
          symbol: position.symbol,
          amount: position.amount,
          price: position.priceAtPurchase / position.amount,
          total: position.priceAtPurchase,
          assetType: 'crypto',
        }));

        // Combine and sort transactions by date (newest first)
        this.transactions = [...stockTransactions, ...cryptoTransactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      },
      error: (error: Error) => {
        console.error('Error loading transactions:', error);
      },
    });
  }
}
