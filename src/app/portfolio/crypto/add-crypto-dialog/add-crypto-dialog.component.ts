import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { CryptoService } from '../../../services/crypto.service';
import { MaterialModule } from '../../../shared/material.module';

@Component({
  selector: 'app-add-crypto-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './add-crypto-dialog.component.html',
  styleUrls: ['./add-crypto-dialog.component.css'],
})
export class AddCryptoDialogComponent {
  crypto: any = {
    name: '',
    symbol: '',
    amount: null,
    purchasePrice: null,
    purchaseDate: new Date(),
  };

  constructor(
    private dialogRef: MatDialogRef<AddCryptoDialogComponent>,
    private cryptoService: CryptoService,
  ) {}

  onSubmit() {
    const cryptoData = {
      ...this.crypto,
      symbol: this.crypto.symbol.toUpperCase(),
      dateAcquired: this.crypto.purchaseDate.toISOString(),
      priceAtPurchase: this.crypto.purchasePrice,
      userId: 1, // TODO: Get from auth service
    };

    this.cryptoService.addPosition(cryptoData).subscribe({
      next: result => {
        this.dialogRef.close(result);
      },
      error: error => {
        console.error('Error adding crypto:', error);
      },
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
