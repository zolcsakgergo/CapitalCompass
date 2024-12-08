import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StockService } from '../../../services/stock.service';

@Component({
  selector: 'app-add-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-stock-dialog.component.html',
  styleUrls: ['./add-stock-dialog.component.css'],
})
export class AddStockDialogComponent {
  stock = {
    stockName: '',
    symbol: '',
    shares: null as number | null,
    priceAtPurchase: null as number | null,
    dateAcquired: new Date(),
  };

  constructor(
    private dialogRef: MatDialogRef<AddStockDialogComponent>,
    private stockService: StockService,
  ) {}

  onSubmit() {
    if (this.stock.shares && this.stock.priceAtPurchase) {
      const stockData = {
        stockName: this.stock.stockName,
        symbol: this.stock.symbol.toUpperCase(),
        shares: Number(this.stock.shares),
        priceAtPurchase: Number(this.stock.priceAtPurchase),
        dateAcquired: this.formatDate(this.stock.dateAcquired),
        userId: 1, // TODO: Get from auth service
      };

      this.stockService.addPosition(stockData).subscribe({
        next: result => {
          this.dialogRef.close(result);
        },
        error: error => {
          console.error('Error adding stock:', error);
        },
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private formatDate(date: Date): string {
    // Format date as YYYY-MM-DD for backend
    return date.toISOString().split('T')[0];
  }
}
