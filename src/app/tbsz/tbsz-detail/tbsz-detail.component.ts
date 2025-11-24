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
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tbsz']);
      return;
    }

    this.tbszService.getAccount(id).subscribe({
      next: (account: TbszAccount) => {
        this.account = account;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load TBSZ account', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/tbsz']);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/tbsz']);
  }

  openAddAssetDialog(): void {
    if (!this.account) {
      return;
    }

    const dialogRef = this.dialog.open(AssetFormComponent, {
      width: '480px',
      data: { accountId: this.account.id },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reloadAccount();
      }
    });
  }

  openEditAssetDialog(asset: Asset): void {
    if (!this.account) {
      return;
    }

    const dialogRef = this.dialog.open(AssetFormComponent, {
      width: '480px',
      data: { accountId: this.account.id, asset },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reloadAccount();
      }
    });
  }

  deleteAsset(asset: Asset): void {
    if (!this.account) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete asset "${asset.name}"?`,
    );
    if (!confirmed) {
      return;
    }

    this.tbszService.deleteAsset(this.account.id, asset.id).subscribe({
      next: () => {
        this.snackBar.open('Asset deleted', 'Close', { duration: 2500 });
        this.reloadAccount();
      },
      error: () => {
        this.snackBar.open('Failed to delete asset', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  private reloadAccount(): void {
    if (!this.account) {
      return;
    }

    this.tbszService
      .getAccount(this.account.id)
      .subscribe((account: TbszAccount) => {
        this.account = account;
      });
  }

  calculateMaturityProgress(): number {
    if (!this.account) {
      return 0;
    }
    return this.tbszService.calculateMaturityProgress(this.account);
  }

  getRemainingDays(): number {
    if (!this.account) {
      return 0;
    }
    return this.tbszService.calculateRemainingDays(this.account);
  }

  getProgressBarColor(): string {
    const progress = this.calculateMaturityProgress();
    if (progress >= 100) {
      return 'primary';
    }
    if (progress >= 75) {
      return 'accent';
    }
    return 'warn';
  }

  getStatusClass(): string {
    const status = this.account?.status?.toUpperCase();
    if (status === 'ACTIVE') {
      return 'status-badge status-active';
    }
    if (status === 'MATURED') {
      return 'status-badge status-matured';
    }
    if (status === 'CLOSED') {
      return 'status-badge status-closed';
    }
    if (status === 'WITHDRAWN') {
      return 'status-badge status-withdrawn';
    }
    return 'status-badge';
  }

  getTotalValue(): number {
    if (!this.account || !this.account.assets) {
      return 0;
    }
    return this.account.assets.reduce((sum, asset) => {
      const currentValue = asset.currentValue ?? 0;
      return sum + currentValue;
    }, 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
    }).format(amount ?? 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('hu-HU');
  }
}
