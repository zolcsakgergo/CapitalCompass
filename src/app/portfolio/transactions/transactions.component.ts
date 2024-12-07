import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { PositionService, Position } from '../../services/position.service';

interface Transaction {
  date: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  shares: number;
  price: number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
})
export class TransactionsComponent implements OnInit {
  displayedColumns: string[] = ['date', 'type', 'symbol', 'shares', 'price'];
  transactions: Transaction[] = [];

  constructor(private positionService: PositionService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.positionService.getPositions().subscribe({
      next: (positions: Position[]) => {
        this.transactions = positions.map(position => ({
          date: position.dateAcquired,
          type: position.type,
          symbol: position.symbol,
          shares: position.shares,
          price: position.priceAtPurchase,
        }));
      },
      error: error => {
        console.error('Error loading transactions:', error);
      },
    });
  }
}
