import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TbszService, TbszAccount, Asset } from '../../services/tbsz.service';
import { AssetFormComponent } from '../asset-form/asset-form.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-tbsz-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './tbsz-detail.component.html',
  styleUrls: ['./tbsz-detail.component.scss'],
})
export class TbszDetailComponent implements OnInit {
  account: TbszAccount | null = null;
  loading = true;
  displayedColumns: string[] = [
    'name',
    'symbol',
    'purchaseDate',
    'purchasePrice',
    'quantity',
    'currentValue',
    'actions',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tbszService: TbszService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadAccountDetails(id);
      }
    });
  }

  loadAccountDetails(id: string): void {
    this.loading = true;
    this.tbszService.getAccount(id).subscribe({
      next: account => {
        this.account = account;
        this.loading = false;
      },
      error: error => {
        console.error('Error loading TBSZ account details', error);
        this.snackBar.open('Error loading account details', 'Close', {
          duration: 3000,
        });
        this.loading = false;
        this.navigateBack();
      },
    });
  }

  navigateBack(): void {
    this.router.navigate(['/tbsz']);
  }

  openAddAssetDialog(): void {
    console.log('Opening add asset dialog...');
    if (!this.account) {
      console.log('No account available');
      return;
    }

    try {
      const dialogRef = this.dialog.open(AssetFormComponent, {
        width: '500px',
        data: {
          isEdit: false,
          tbszAccountId: this.account.id,
        },
      });

      console.log('Asset dialog reference created:', dialogRef);

      dialogRef.afterOpened().subscribe(() => {
        console.log('Asset dialog opened successfully');
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Asset dialog closed with result:', result);
        if (result && this.account) {
          this.loadAccountDetails(this.account.id);
        }
      });
    } catch (error) {
      console.error('Error opening asset dialog:', error);
    }
  }

  openEditAssetDialog(asset: Asset): void {
    if (!this.account) return;

    const dialogRef = this.dialog.open(AssetFormComponent, {
      width: '500px',
      data: {
        isEdit: true,
        asset: asset,
        tbszAccountId: this.account.id,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.account) {
        this.loadAccountDetails(this.account.id);
      }
    });
  }

  deleteAsset(asset: Asset): void {
    if (!this.account) return;

    if (confirm(`Are you sure you want to delete ${asset.name}?`)) {
      this.tbszService.deleteAsset(this.account.id, asset.id).subscribe({
        next: () => {
          this.snackBar.open('Asset deleted successfully', 'Close', {
            duration: 3000,
          });
          if (this.account) {
            this.loadAccountDetails(this.account.id);
          }
        },
        error: error => {
          console.error('Error deleting asset', error);
          this.snackBar.open('Error deleting asset', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  calculateMaturityProgress(): number {
    if (!this.account) return 0;
    return this.tbszService.calculateMaturityProgress(this.account);
  }

  getRemainingDays(): number {
    if (!this.account) return 0;
    return this.tbszService.calculateRemainingDays(this.account);
  }

  getProgressBarColor(): string {
    if (!this.account) return 'warn';
    const progress = this.calculateMaturityProgress();
    if (progress >= 100) {
      return 'accent'; // Matured
    } else if (progress >= 75) {
      return 'primary'; // Almost there
    } else {
      return 'warn'; // Still a long way to go
    }
  }

  getStatusClass(): string {
    if (!this.account) return '';
    switch (this.account.status) {
      case 'ACTIVE':
        return 'status-active';
      case 'MATURED':
        return 'status-matured';
      case 'CLOSED':
        return 'status-closed';
      case 'WITHDRAWN':
        return 'status-withdrawn';
      default:
        return '';
    }
  }

  getTotalValue(): number {
    if (!this.account || !this.account.assets) return 0;
    return this.account.assets.reduce(
      (sum, asset) => sum + asset.currentValue,
      0,
    );
  }

  exportToCsv(): void {
    if (!this.account) return;
    this.tbszService.exportToCsv(this.account);
  }

  exportToJson(): void {
    if (!this.account) return;
    this.tbszService.exportToJson(this.account);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('hu-HU');
  }
}
