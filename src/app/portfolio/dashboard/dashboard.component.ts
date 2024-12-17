import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialSharedModule } from '../../shared/material-shared.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { StockService } from '../../services/stock.service';
import { CryptoService } from '../../services/crypto.service';
import { Subject, takeUntil } from 'rxjs';
import { Chart, ChartType } from 'chart.js';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  PieController,
  BarController,
  LineController,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  PieController,
  BarController,
  LineController,
);

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
    FormsModule,
    MaterialSharedModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  totalValue = 0;
  totalChangePercent = 0;
  totalPositions = 0;
  stocksCount = 0;
  cryptoCount = 0;
  selectedInterval = '1d';
  selectedChartType: ChartType = 'pie';
  bestPerformer: PerformanceData | null = null;
  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private stockService: StockService,
    private cryptoService: CryptoService,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private loadChart() {
    if (!this.chartCanvas) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    const data = this.prepareChartData();
    const options = this.getChartOptions();

    this.chart = new Chart(ctx, {
      type: this.selectedChartType,
      data,
      options,
    });
  }

  private loadData() {
    // Reset values before loading new data
    this.totalValue = 0;
    this.totalChangePercent = 0;
    this.bestPerformer = null;

    console.log('Dashboard: Starting data load');

    // Load stocks
    this.stockService.getPositions().subscribe(stocks => {
      console.log('Dashboard: Raw stock data:', stocks);

      this.stocksCount = stocks.length;

      let totalInitialValue = 0;
      let totalCurrentValue = 0;

      // Process stocks
      stocks.forEach(stock => {
        console.log('Dashboard: Processing stock:', stock);

        const quantity = stock.shares;
        const initialValue = stock.priceAtPurchase * quantity;
        const currentValue =
          (stock.currentPrice ?? stock.priceAtPurchase) * quantity;

        console.log('Dashboard: Stock calculations:', {
          name: stock.stockName,
          shares: quantity,
          purchasePrice: stock.priceAtPurchase,
          currentPrice: stock.currentPrice,
          initialValue,
          currentValue,
        });

        totalInitialValue += initialValue;
        totalCurrentValue += currentValue;

        const changePercent =
          initialValue === 0
            ? 0
            : ((currentValue - initialValue) / initialValue) * 100;

        const performanceData: PerformanceData = {
          name: stock.stockName,
          type: 'stock',
          changePercent: isFinite(changePercent) ? changePercent : 0,
          value: currentValue,
        };

        if (
          !this.bestPerformer ||
          changePercent > this.bestPerformer.changePercent
        ) {
          this.bestPerformer = performanceData;
        }
      });

      // Load crypto after stocks are processed
      this.cryptoService.getPositions().subscribe(cryptos => {
        console.log('Dashboard: Raw crypto data:', cryptos);

        this.cryptoCount = cryptos.length;

        // Process cryptos
        cryptos.forEach(crypto => {
          console.log('Dashboard: Processing crypto:', crypto);

          const quantity = crypto.amount;
          const initialValue = crypto.priceAtPurchase * quantity;
          const currentValue =
            (crypto.currentPrice ?? crypto.priceAtPurchase) * quantity;

          console.log('Dashboard: Crypto calculations:', {
            name: crypto.name,
            amount: quantity,
            purchasePrice: crypto.priceAtPurchase,
            currentPrice: crypto.currentPrice,
            initialValue,
            currentValue,
          });

          totalInitialValue += initialValue;
          totalCurrentValue += currentValue;

          // Prevent division by zero
          const changePercent =
            initialValue === 0
              ? 0
              : ((currentValue - initialValue) / initialValue) * 100;

          const performanceData: PerformanceData = {
            name: crypto.name,
            type: 'crypto',
            changePercent: isFinite(changePercent) ? changePercent : 0, // Handle Infinity
            value: currentValue,
          };

          if (
            !this.bestPerformer ||
            changePercent > this.bestPerformer.changePercent
          ) {
            this.bestPerformer = performanceData;
          }
        });

        // Update total portfolio value and change after both stocks and crypto are processed
        this.totalValue = totalCurrentValue;
        if (totalInitialValue > 0) {
          const totalChange =
            ((totalCurrentValue - totalInitialValue) / totalInitialValue) * 100;
          this.totalChangePercent = isFinite(totalChange) ? totalChange : 0;
        } else {
          this.totalChangePercent = 0;
        }

        this.updateTotalPositions();

        console.log('Dashboard: Final calculations:', {
          totalInitialValue,
          totalCurrentValue,
          totalValue: this.totalValue,
          totalChangePercent: this.totalChangePercent,
          stocksCount: this.stocksCount,
          cryptoCount: this.cryptoCount,
        });

        // Update the chart after all calculations
        this.updateChart();
      });
    });
  }

  private updateTotalPositions() {
    this.totalPositions = this.stocksCount + this.cryptoCount;
  }

  updatePerformance() {
    console.log('Updating performance for interval:', this.selectedInterval);
    this.loadData();
  }

  async updateChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.chartCanvas) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    const data = this.prepareChartData();
    const options = this.getChartOptions();

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: this.selectedChartType,
      data,
      options,
    });
  }

  private prepareChartData() {
    const defaultData = {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    };

    switch (this.selectedChartType) {
      case 'pie':
        return {
          labels: ['Stocks', 'Crypto'],
          datasets: [
            {
              data: [this.stocksCount, this.cryptoCount],
              backgroundColor: ['#4299E1', '#9F7AEA'],
            },
          ],
        };
      case 'bar':
        return {
          labels: ['Assets'],
          datasets: [
            {
              label: 'Stocks',
              data: [this.stocksCount],
              backgroundColor: '#4299E1',
            },
            {
              label: 'Crypto',
              data: [this.cryptoCount],
              backgroundColor: '#9F7AEA',
            },
          ],
        };
      case 'line':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Portfolio Value',
              data: [0, 0, 0, 0, 0, this.totalValue],
              borderColor: '#4299E1',
              tension: 0.1,
            },
          ],
        };
      default:
        return defaultData;
    }
  }

  private getChartOptions() {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
    };

    switch (this.selectedChartType) {
      case 'pie':
        return {
          ...baseOptions,
          plugins: {
            legend: {
              position: 'bottom' as const,
            },
          },
        };
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        };
      case 'line':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        };
      default:
        return baseOptions;
    }
  }
}
