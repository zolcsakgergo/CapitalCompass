import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialSharedModule } from '../../../shared/material-shared.module';
import { MaterialFormsModule } from '../../../shared/material-forms.module';
import { MaterialFeedbackModule } from '../../../shared/material-feedback.module';
import { MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { StockService } from '../../../services/stock.service';

interface StockData {
  stockName: string;
  symbol: string;
  shares: number;
  priceAtPurchase: number;
  dateAcquired: string;
  userId: number;
  type: 'stock';
}

@Component({
  selector: 'app-add-stock-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialSharedModule,
    MaterialFormsModule,
    MaterialFeedbackModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-stock-dialog.component.html',
  styleUrls: ['./add-stock-dialog.component.css'],
})
export class AddStockDialogComponent {
  stock: any = {
    stockName: '',
    symbol: '',
    shares: null,
    purchasePrice: null,
    purchaseDate: new Date(),
  };

  constructor(
    private dialogRef: MatDialogRef<AddStockDialogComponent>,
    private stockService: StockService,
  ) {}

  onSubmit() {
    if (!this.isFormValid()) {
      console.error('Form validation failed');
      return;
    }

    try {
      // Format the date to ISO string
      const date = new Date(this.stock.purchaseDate);
      const isoDate = date.toISOString().split('T')[0];

      const stockData: StockData = {
        stockName: this.stock.stockName.trim(),
        symbol: this.stock.symbol.toUpperCase().trim(),
        shares: Number(this.stock.shares),
        priceAtPurchase: Number(Number(this.stock.purchasePrice).toFixed(2)),
        dateAcquired: isoDate,
        userId: 1, // TODO: Get from auth service
        type: 'stock' as const,
      };

      this.stockService.addPosition(stockData).subscribe({
        next: result => {
          this.dialogRef.close(result);
        },
        error: error => {
          console.error('Error adding stock:', error);
          console.error('Request payload:', JSON.stringify(stockData, null, 2));
        },
      });
    } catch (error) {
      console.error('Error preparing stock data:', error);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private isFormValid(): boolean {
    if (!this.stock.stockName || !this.stock.symbol) {
      console.error('Name or symbol is missing');
      return false;
    }

    const shares = Number(this.stock.shares);
    if (isNaN(shares) || shares <= 0) {
      console.error('Invalid shares:', this.stock.shares);
      return false;
    }

    const price = Number(this.stock.purchasePrice);
    if (isNaN(price) || price <= 0) {
      console.error('Invalid price:', this.stock.purchasePrice);
      return false;
    }

    if (
      !(this.stock.purchaseDate instanceof Date) ||
      isNaN(this.stock.purchaseDate.getTime())
    ) {
      console.error('Invalid date:', this.stock.purchaseDate);
      return false;
    }

    return true;
  }
}
