import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialSharedModule } from '../../shared/material-shared.module';
import { MaterialFormsModule } from '../../shared/material-forms.module';
import { FormsModule } from '@angular/forms';
import { QuickTradeComponent } from './quick-trade/quick-trade.component';
import { StockService } from '../../services/stock.service';
import { CryptoService } from '../../services/crypto.service';
import { AuthService } from '../../auth/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { ChartConfiguration, ChartType } from 'chart.js';
import { PortfolioChartDirective } from '../../directives/portfolio-chart.directive';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

interface PerformanceData {
  name: string;
  type: string;
  changePercent: number;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MaterialSharedModule,
    MaterialFormsModule,
    FormsModule,
    QuickTradeComponent,
    PortfolioChartDirective,
    MatMenuModule,
    MatDividerModule,
    RouterModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalValue = 0;
  totalChangePercent = 0;
  totalPositions = 0;
  stocksCount = 0;
  cryptoCount = 0;
  bestPerformer: PerformanceData | null = null;

  selectedChartType: ChartType = 'pie';
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  };
  chartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private stockService: StockService,
    private cryptoService: CryptoService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    this.totalValue = 0;
    this.totalChangePercent = 0;
    this.bestPerformer = null;

    this.stockService
      .getPositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stocks => {
        this.stocksCount = stocks.length;
        let totalStockValue = 0;
        let totalStockInitialValue = 0;

        stocks.forEach(stock => {
          const currentValue =
            stock.shares * (stock.currentPrice ?? stock.priceAtPurchase);
          const initialValue = stock.shares * stock.priceAtPurchase;
          totalStockValue += currentValue;
          totalStockInitialValue += initialValue;

          const changePercent =
            initialValue > 0
              ? ((currentValue - initialValue) / initialValue) * 100
              : 0;
          this.updateBestPerformer(
            stock.stockName,
            'stock',
            changePercent,
            currentValue,
          );
        });

        this.cryptoService
          .getPositions()
          .pipe(takeUntil(this.destroy$))
          .subscribe(cryptos => {
            this.cryptoCount = cryptos.length;
            let totalCryptoValue = 0;
            let totalCryptoInitialValue = 0;

            cryptos.forEach(crypto => {
              const currentValue =
                crypto.amount * (crypto.currentPrice ?? crypto.priceAtPurchase);
              const initialValue = crypto.amount * crypto.priceAtPurchase;
              totalCryptoValue += currentValue;
              totalCryptoInitialValue += initialValue;

              const changePercent =
                initialValue > 0
                  ? ((currentValue - initialValue) / initialValue) * 100
                  : 0;
              this.updateBestPerformer(
                crypto.name,
                'crypto',
                changePercent,
                currentValue,
              );
            });

            this.totalValue = totalStockValue + totalCryptoValue;
            const totalInitialValue =
              totalStockInitialValue + totalCryptoInitialValue;
            this.totalChangePercent =
              totalInitialValue > 0
                ? ((this.totalValue - totalInitialValue) / totalInitialValue) *
                  100
                : 0;

            this.updateTotalPositions();
            this.updateChartData(totalStockValue, totalCryptoValue);
          });
      });
  }

  private updateBestPerformer(
    name: string,
    type: string,
    changePercent: number,
    value: number,
  ) {
    if (
      !this.bestPerformer ||
      changePercent > this.bestPerformer.changePercent
    ) {
      this.bestPerformer = { name, type, changePercent, value };
    }
  }

  private updateTotalPositions() {
    this.totalPositions = this.stocksCount + this.cryptoCount;
  }

  private updateChartData(stocksValue: number, cryptoValue: number) {
    this.chartData = {
      labels: ['Stocks', 'Crypto'],
      datasets: [
        {
          data: [stocksValue, cryptoValue],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          hoverBackgroundColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(153, 102, 255, 1)',
          ],
        },
      ],
    };
  }

  updateChart() {
    this.loadData();
  }

  handleQuickTrade(trade: any) {
    if (trade.assetType === 'stock') {
      this.stockService
        .addPosition({
          stockName: trade.symbol,
          symbol: trade.symbol,
          shares: trade.quantity,
          priceAtPurchase: 0,
          dateAcquired: new Date().toISOString(),
          type: 'stock',
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadData(),
          error: error => console.error('Error processing stock trade:', error),
        });
    } else {
      this.cryptoService
        .addPosition({
          name: trade.symbol,
          symbol: trade.symbol,
          amount: trade.quantity,
          priceAtPurchase: 0,
          dateAcquired: new Date().toISOString(),
          type: 'crypto',
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadData(),
          error: error =>
            console.error('Error processing crypto trade:', error),
        });
    }
  }

  handleTradeCancelled() {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
