import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TbszAccount } from '../../services/tbsz.service';

interface DialogData {
  account: TbszAccount;
  remainingDays: number;
}

@Component({
  selector: 'app-early-withdrawal-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon color="warn">warning</mat-icon>
      Early Withdrawal Warning
    </h2>

    <mat-dialog-content>
      <div class="warning-container">
        <div class="warning-section critical">
          <h3>⚠️ Critical Information</h3>
          <p>
            You are about to withdraw from your TBSZ account
            <strong>{{ data.remainingDays }} days before maturity</strong>.
          </p>
        </div>

        <div class="warning-section">
          <h3>📊 Tax Consequences</h3>
          <ul>
            <li>
              <strong>All gains will be taxed at 15%</strong> (Hungarian capital
              gains tax)
            </li>
            <li>
              You will <strong>lose the tax-free benefit</strong> that would
              apply after 5 years
            </li>
            <li>Tax must be paid when filing your annual tax return</li>
          </ul>
        </div>

        <div class="warning-section">
          <h3>💰 Financial Impact</h3>
          <p>
            <strong>Estimated tax liability:</strong>
            {{ calculateTaxLiability() }} HUF
          </p>
          <p class="small-text">
            *Based on current portfolio value vs initial deposit. Actual tax may
            vary based on individual transactions.
          </p>
        </div>

        <div class="warning-section">
          <h3>⏱️ Maturity Timeline</h3>
          <p>
            Your account will reach tax-free maturity on:
            <strong>{{ formatDate(data.account.maturityDate) }}</strong>
          </p>
          <p>
            Only
            <strong>{{ formatYearsMonths(data.remainingDays) }}</strong>
            remaining until full tax exemption!
          </p>
        </div>

        <div class="confirmation-box">
          <p>
            <mat-icon>info</mat-icon>
            By proceeding, you acknowledge that you understand the tax
            implications and potential financial loss from early withdrawal.
          </p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        Cancel - Keep Account Active
      </button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        Proceed with Early Withdrawal
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .warning-container {
        padding: 16px 0;
      }

      .warning-section {
        margin-bottom: 24px;
        padding: 16px;
        border-radius: 8px;
        background-color: #f5f5f5;

        &.critical {
          background-color: #fff3e0;
          border-left: 4px solid #ff9800;
        }

        h3 {
          margin: 0 0 12px 0;
          font-size: 1.1em;
          font-weight: 600;
        }

        p {
          margin: 8px 0;
          line-height: 1.6;
        }

        ul {
          margin: 8px 0;
          padding-left: 20px;

          li {
            margin: 8px 0;
            line-height: 1.6;
          }
        }

        .small-text {
          font-size: 0.85em;
          color: #666;
          font-style: italic;
        }
      }

      .confirmation-box {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 16px;
        border-radius: 8px;
        display: flex;
        align-items: flex-start;

        mat-icon {
          margin-right: 12px;
          color: #2196f3;
        }

        p {
          margin: 0;
          flex: 1;
        }
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      mat-dialog-actions {
        padding: 16px 24px;
      }
    `,
  ],
})
export class EarlyWithdrawalDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EarlyWithdrawalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  calculateTaxLiability(): string {
    const totalValue =
      this.data.account.assets?.reduce(
        (sum, asset) => sum + asset.currentValue,
        0,
      ) || 0;

    const gain = totalValue - this.data.account.initialDepositAmount;

    if (gain <= 0) {
      return '0 (No taxable gain)';
    }

    const taxRate = 0.15;
    const estimatedTax = gain * taxRate;

    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(estimatedTax);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatYearsMonths(days: number): string {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const remainingDays = days % 30;

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (remainingDays > 0 || parts.length === 0) {
      parts.push(`${remainingDays} day${remainingDays !== 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
