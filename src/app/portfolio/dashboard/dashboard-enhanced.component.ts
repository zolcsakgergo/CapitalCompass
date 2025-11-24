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
import { ChartConfiguration } from 'chart.js';
import { PortfolioChartDirective } from '../../directives/portfolio-chart.directive';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { PortfolioAnalyticsService } from '../../services/portfolio-analytics.service';

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
  providers: [PortfolioAnalyticsService],
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

  allocationChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  };
  allocationChartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 20,
        },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: context => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  growthChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  };
  growthChartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12 },
          padding: 15,
        },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: context => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Timeline',
        },
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Portfolio Value ($)',
        },
        ticks: {
          callback: value => '$' + Number(value).toLocaleString(),
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  gainsChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  };
  gainsChartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: context => {
            const value = context.parsed.y;
            return `Gain/Loss: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => '$' + Number(value).toLocaleString(),
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  performanceChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [],
  };
  performanceChartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: context => {
            const value = context.parsed.y;
            return `Return: ${value.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => value + '%',
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  private destroy$ = new Subject<void>();
  private stockPositions: any[] = [];
  private cryptoPositions: any[] = [];

  constructor(
    private stockService: StockService,
    private cryptoService: CryptoService,
    private authService: AuthService,
    private router: Router,
    private portfolioAnalyticsService: PortfolioAnalyticsService,
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

    const stocksData: {
      name: string;
      currentValue: number;
      initialValue: number;
      changePercent: number;
    }[] = [];
    const cryptoData: {
      name: string;
      currentValue: number;
      initialValue: number;
      changePercent: number;
    }[] = [];

    this.stockService
      .getPositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stocks => {
        this.stocksCount = stocks.length;
        this.stockPositions = stocks;
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

          stocksData.push({
            name: stock.stockName,
            currentValue,
            initialValue,
            changePercent,
          });

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
            this.cryptoPositions = cryptos;
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

              cryptoData.push({
                name: crypto.name,
                currentValue,
                initialValue,
                changePercent,
              });

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
            this.updateAllocationChart(totalStockValue, totalCryptoValue);
            this.updateGainsChart(stocksData, cryptoData);
            this.updateGrowthChart(
              totalStockInitialValue,
              totalStockValue,
              totalCryptoInitialValue,
              totalCryptoValue,
            );
            this.updatePerformanceChart(
              totalStockValue,
              totalStockInitialValue,
              totalCryptoValue,
              totalCryptoInitialValue,
            );
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

  private updateAllocationChart(stocksValue: number, cryptoValue: number) {
    this.allocationChartData = {
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

  private updateGainsChart(
    stocksData: { name: string; currentValue: number; initialValue: number }[],
    cryptoData: { name: string; currentValue: number; initialValue: number }[],
  ) {
    const allAssets = [...stocksData, ...cryptoData];
    const labels = allAssets.map(asset => asset.name);
    const gains = allAssets.map(
      asset => asset.currentValue - asset.initialValue,
    );

    const backgroundColors = gains.map(gain =>
      gain >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)',
    );
    const hoverColors = gains.map(gain =>
      gain >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)',
    );

    this.gainsChartData = {
      labels,
      datasets: [
        {
          label: 'Gain/Loss',
          data: gains,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverColors,
        },
      ],
    };
  }

  private updateGrowthChart(
    stockInitial: number,
    stockCurrent: number,
    cryptoInitial: number,
    cryptoCurrent: number,
  ) {
    const months = 12;
    const labels: string[] = [];
    const now = new Date();

    for (let i = months; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      labels.push(
        date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      );
    }

    const totalInitial = stockInitial + cryptoInitial;
    const totalCurrent = stockCurrent + cryptoCurrent;
    const totalGrowth = totalCurrent - totalInitial;

    const stockData: number[] = [];
    const cryptoData: number[] = [];
    const totalData: number[] = [];

    for (let i = 0; i <= months; i++) {
      const progress = i / months;
      const stockGrowth = stockCurrent - stockInitial;
      const cryptoGrowth = cryptoCurrent - cryptoInitial;

      stockData.push(stockInitial + stockGrowth * progress);
      cryptoData.push(cryptoInitial + cryptoGrowth * progress);
      totalData.push(totalInitial + totalGrowth * progress);
    }

    this.growthChartData = {
      labels,
      datasets: [
        {
          label: 'Stocks',
          data: stockData,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Crypto',
          data: cryptoData,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Total Portfolio',
          data: totalData,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    };
  }

  private updatePerformanceChart(
    stockCurrent: number,
    stockInitial: number,
    cryptoCurrent: number,
    cryptoInitial: number,
  ) {
    const stockReturn =
      stockInitial > 0
        ? ((stockCurrent - stockInitial) / stockInitial) * 100
        : 0;
    const cryptoReturn =
      cryptoInitial > 0
        ? ((cryptoCurrent - cryptoInitial) / cryptoInitial) * 100
        : 0;

    const returns = [stockReturn, cryptoReturn];
    const backgroundColors = returns.map(ret =>
      ret >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)',
    );
    const hoverColors = returns.map(ret =>
      ret >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)',
    );

    this.performanceChartData = {
      labels: ['Stocks Performance', 'Crypto Performance'],
      datasets: [
        {
          label: 'Return %',
          data: returns,
          backgroundColor: backgroundColors,
          hoverBackgroundColor: hoverColors,
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
