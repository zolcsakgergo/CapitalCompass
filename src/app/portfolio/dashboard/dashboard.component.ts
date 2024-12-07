import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PositionService } from '../../services/position.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  totalValue: number | null = null;
  totalPositions: number | null = null;
  dailyChange: number | null = null;
  ytdChange: number | null = null;

  constructor(private positionService: PositionService) {}

  ngOnInit() {
    this.loadPortfolioSummary();
  }

  loadPortfolioSummary() {
    this.positionService.getPortfolioSummary().subscribe({
      next: summary => {
        this.totalValue = summary.totalValue;
        this.totalPositions = summary.totalPositions;
        this.dailyChange = summary.dailyChange;
        this.ytdChange = summary.ytdChange;
      },
      error: error => {
        console.error('Error loading portfolio summary:', error);
      },
    });
  }

  getStatusColor(value: number | null): { [key: string]: boolean } {
    if (value === null) return {};
    return {
      positive: value > 0,
      negative: value < 0,
    };
  }
}
