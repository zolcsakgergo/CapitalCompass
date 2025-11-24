import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TbszService, TbszAccount } from '../../services/tbsz.service';
import { TbszFormComponent } from '../tbsz-form/tbsz-form.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-tbsz-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './tbsz-dashboard.component.html',
  styleUrls: ['./tbsz-dashboard.component.scss'],
})
export class TbszDashboardComponent implements OnInit {
  accounts: TbszAccount[] = [];
  loading = true;

  constructor(
    private tbszService: TbszService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.tbszService.getAccounts().subscribe({
      next: accounts => {
        this.accounts = accounts;
        this.loading = false;
      },
      error: error => {
        console.error('Error loading TBSZ accounts', error);
        this.loading = false;
      },
    });
  }

  openAccountDetails(accountId: string): void {
    this.router.navigate(['/tbsz', accountId]);
  }

  openCreateAccountDialog(): void {
    const dialogRef = this.dialog.open(TbszFormComponent, {
      width: '500px',
      maxWidth: '90vw',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAccounts();
      }
    });
  }

  openEditAccountDialog(account: TbszAccount, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(TbszFormComponent, {
      width: '500px',
      data: { isEdit: true, account },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAccounts();
      }
    });
  }

  deleteAccount(account: TbszAccount, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete ${account.name}?`)) {
      this.tbszService.deleteAccount(account.id).subscribe({
        next: () => {
          this.loadAccounts();
        },
        error: error => {
          console.error('Error deleting TBSZ account', error);
        },
      });
    }
  }

  calculateMaturityProgress(account: TbszAccount): number {
    return this.tbszService.calculateMaturityProgress(account);
  }

  getRemainingDays(account: TbszAccount): number {
    return this.tbszService.calculateRemainingDays(account);
  }

  calculateTaxLiability(account: TbszAccount): number {
    const totalValue =
      account.assets?.reduce((sum, asset) => sum + asset.currentValue, 0) || 0;
    const gain = totalValue - account.initialDepositAmount;
    if (gain <= 0) {
      return 0;
    }
    const taxRate = 0.15;
    return gain * taxRate;
  }

  getAccountStatusClass(account: TbszAccount): string {
    const status = account.status?.toUpperCase();
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

  getProgressBarColor(account: TbszAccount): string {
    const progress = this.calculateMaturityProgress(account);
    if (progress >= 100) {
      return 'primary';
    }
    if (progress >= 75) {
      return 'accent';
    }
    return 'warn';
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
