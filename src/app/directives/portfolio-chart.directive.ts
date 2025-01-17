import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  NgZone,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import './chart-registry';

@Directive({
  selector: '[appPortfolioChart]',
  standalone: true,
})
export class PortfolioChartDirective implements OnInit, OnChanges, OnDestroy {
  @Input() chartType!: ChartType;
  @Input() chartData!: ChartConfiguration['data'];
  @Input() chartOptions!: ChartConfiguration['options'];

  private chart: Chart | null = null;

  constructor(
    private el: ElementRef<HTMLCanvasElement>,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    this.validateInputs();
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.chart) {
      return;
    }

    try {
      if (changes['chartType'] && !changes['chartType'].firstChange) {
        this.ngZone.runOutsideAngular(() => {
          this.chart?.destroy();
          this.createChart();
        });
      } else if (
        (changes['chartData'] && !changes['chartData'].firstChange) ||
        (changes['chartOptions'] && !changes['chartOptions'].firstChange)
      ) {
        this.updateChart();
      }
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.ngZone.runOutsideAngular(() => {
        this.chart?.destroy();
      });
    }
  }

  private validateInputs() {
    if (!this.chartType) {
      throw new Error('Chart type is required');
    }
    if (!this.chartData) {
      throw new Error('Chart data is required');
    }
    if (!this.chartOptions) {
      throw new Error('Chart options are required');
    }
  }

  private createChart() {
    try {
      this.ngZone.runOutsideAngular(() => {
        this.chart = new Chart(this.el.nativeElement, {
          type: this.chartType,
          data: this.chartData,
          options: {
            ...this.chartOptions,
            animation: {
              duration: 750,
              easing: 'easeInOutQuart',
            },
            responsive: true,
            maintainAspectRatio: false,
          },
        });
      });
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }

  private updateChart() {
    if (!this.chart) {
      return;
    }

    try {
      this.ngZone.runOutsideAngular(() => {
        if (this.chart) {
          this.chart.data = this.chartData;
          if (this.chartOptions) {
            this.chart.options = {
              ...this.chartOptions,
              animation: {
                duration: 750,
                easing: 'easeInOutQuart',
              },
              responsive: true,
              maintainAspectRatio: false,
            };
          }
          this.chart.update('active');
        }
      });
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }
}
