import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialSharedModule } from '../../../shared/material-shared.module';
import { MaterialFormsModule } from '../../../shared/material-forms.module';
import { MaterialFeedbackModule } from '../../../shared/material-feedback.module';
import { MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CryptoService } from '../../../services/crypto.service';

interface CryptoData {
  name: string;
  symbol: string;
  amount: number;
  priceAtPurchase: number;
  dateAcquired: string;
  transactionType: 'BUY' | 'SELL';
  type: 'crypto';
}

@Component({
  selector: 'app-add-crypto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialSharedModule,
    MaterialFormsModule,
    MaterialFeedbackModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './add-crypto-dialog.component.html',
  styleUrls: ['./add-crypto-dialog.component.scss'],
})
export class AddCryptoDialogComponent {
  transactionTypes: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
  crypto: any = {
    name: '',
    symbol: '',
    amount: null,
    priceAtPurchase: null,
    dateAcquired: new Date(),
    transactionType: 'BUY',
    type: 'crypto',
  };

  constructor(
    private dialogRef: MatDialogRef<AddCryptoDialogComponent>,
    private cryptoService: CryptoService,
  ) {}

  onSubmit() {
    if (!this.isFormValid()) {
      console.error('Form validation failed');
      return;
    }

    try {
      // Format the date to ISO string
      const date = new Date(this.crypto.dateAcquired);
      const isoDate = date.toISOString().split('T')[0];

      const cryptoData = {
        name: this.crypto.name.trim(),
        symbol: this.crypto.symbol.toUpperCase().trim(),
        amount: Number(this.crypto.amount),
        priceAtPurchase: Number(Number(this.crypto.priceAtPurchase).toFixed(2)),
        dateAcquired: isoDate,
        type: 'crypto' as const,
      };

      this.cryptoService.addPosition(cryptoData).subscribe({
        next: result => {
          console.log('Successfully added crypto position:', result);
          this.dialogRef.close(result);
        },
        error: error => {
          console.error('Error adding crypto:', error);
          console.error(
            'Request payload:',
            JSON.stringify(cryptoData, null, 2),
          );
        },
      });
    } catch (error) {
      console.error('Error preparing crypto data:', error);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  private isFormValid(): boolean {
    if (!this.crypto.name || !this.crypto.symbol) {
      console.error('Name or symbol is missing');
      return false;
    }

    const amount = Number(this.crypto.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', this.crypto.amount);
      return false;
    }

    const price = Number(this.crypto.priceAtPurchase);
    if (isNaN(price) || price <= 0) {
      console.error('Invalid price:', this.crypto.priceAtPurchase);
      return false;
    }

    if (
      !(this.crypto.dateAcquired instanceof Date) ||
      isNaN(this.crypto.dateAcquired.getTime())
    ) {
      console.error('Invalid date:', this.crypto.dateAcquired);
      return false;
    }

    return true;
  }
}
