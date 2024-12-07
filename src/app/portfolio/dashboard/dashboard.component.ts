import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <h1>Portfolio Overview</h1>
      <div class="dashboard-grid">
        <mat-card>
          <mat-card-header>
            <mat-icon>account_balance</mat-icon>
            <mat-card-title>Total Value</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>$10,000</h2>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon>show_chart</mat-icon>
            <mat-card-title>Total Positions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>5</h2>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon>trending_up</mat-icon>
            <mat-card-title>Today's Change</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2 class="positive">+2.5%</h2>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 20px;
      }

      h1 {
        margin-bottom: 24px;
        color: #2d3748;
        font-size: 24px;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 24px;
      }

      mat-card {
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      mat-card-header {
        padding: 16px;
        border-bottom: 1px solid #edf2f7;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      mat-icon {
        color: #4a5568;
      }

      mat-card-title {
        margin: 0;
        font-size: 16px;
        color: #4a5568;
      }

      mat-card-content {
        padding: 24px 16px;
      }

      h2 {
        margin: 0;
        font-size: 32px;
        font-weight: 600;
        color: #2d3748;
      }

      .positive {
        color: #48bb78;
      }

      .negative {
        color: #f56565;
      }
    `,
  ],
})
export class DashboardComponent {}
