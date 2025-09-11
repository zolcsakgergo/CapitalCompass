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
    console.log('TBSZ Dashboard: Loading accounts...');
    this.loading = true;
    this.tbszService.getAccounts().subscribe({
      next: accounts => {
        console.log('TBSZ Dashboard: Accounts loaded:', accounts);
        this.accounts = accounts;
        this.loading = false;
      },
      error: error => {
        console.error('TBSZ Dashboard: Error loading TBSZ accounts', error);
        this.loading = false;
      },
    });
  }

  openAccountDetails(accountId: string): void {
    this.router.navigate(['/tbsz', accountId]);
  }

  openCreateAccountDialog(): void {
    console.log('Opening create account dialog...');
    try {
      const dialogRef = this.dialog.open(TbszFormComponent, {
        width: '500px',
        maxWidth: '90vw',
        height: 'auto',
        maxHeight: '90vh',
        disableClose: false,
        autoFocus: true,
        data: { isEdit: false },
      });

      console.log('Dialog reference created:', dialogRef);

      dialogRef.afterOpened().subscribe(() => {
        console.log('Dialog opened successfully');
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Dialog closed with result:', result);
        if (result) {
          this.loadAccounts();
        }
      });
    } catch (error) {
      console.error('Error opening dialog:', error);
    }
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

  getAccountStatusClass(account: TbszAccount): string {
    switch (account.status) {
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

  getProgressBarColor(account: TbszAccount): string {
    const progress = this.calculateMaturityProgress(account);
    if (progress >= 100) {
      return 'accent'; // Matured
    } else if (progress >= 75) {
      return 'primary'; // Almost there
    } else {
      return 'warn'; // Still a long way to go
    }
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
