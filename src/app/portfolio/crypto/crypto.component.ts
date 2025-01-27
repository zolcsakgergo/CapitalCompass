import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CryptoService } from '../../services/crypto.service';
import { CryptoPosition } from '../../interfaces/position.interface';
import { AddCryptoDialogComponent } from './add-crypto-dialog/add-crypto-dialog.component';

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './crypto.component.html',
  styleUrls: ['./crypto.component.scss'],
})
export class CryptoComponent implements OnInit {
  cryptos: CryptoPosition[] = [];
  displayedColumns: string[] = [
    'name',
    'symbol',
    'amount',
    'purchasePrice',
    'currentPrice',
    'totalChange',
    'actions',
  ];

  constructor(
    private dialog: MatDialog,
    private cryptoService: CryptoService,
  ) {}

  ngOnInit() {
    this.loadCryptos();
  }

  openAddCryptoDialog() {
    const dialogRef = this.dialog.open(AddCryptoDialogComponent, {
      width: '400px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCryptos();
      }
    });
  }

  deleteCrypto(id: number) {
    if (confirm('Are you sure you want to delete this cryptocurrency?')) {
      this.cryptoService.deletePosition(id).subscribe({
        next: () => {
          this.loadCryptos();
        },
        error: (error: Error) => {
          console.error('Error deleting crypto:', error);
        },
      });
    }
  }

  private loadCryptos() {
    this.cryptoService.getPositions().subscribe({
      next: (cryptos: CryptoPosition[]) => {
        this.cryptos = cryptos;
      },
      error: (error: Error) => {
        console.error('Error loading cryptos:', error);
      },
    });
  }
}
