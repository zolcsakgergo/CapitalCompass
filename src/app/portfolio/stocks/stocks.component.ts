import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AddStockDialogComponent } from './add-stock-dialog/add-stock-dialog.component';
import { StockService } from '../../services/stock.service';
import { StockPosition } from '../../interfaces/position.interface';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css'],
})
export class StocksComponent implements OnInit, OnDestroy {
  dataSource: MatTableDataSource<StockPosition>;
  displayedColumns: string[] = [
    'stockName',
    'symbol',
    'shares',
    'priceAtPurchase',
    'currentPrice',
    'currentValue',
    'totalChange',
    'actions',
  ];
  isLoading = false;
  error: string | null = null;
  private positionsSubscription: Subscription | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<StockPosition>;

  constructor(
    private dialog: MatDialog,
    private stockService: StockService,
  ) {
    this.dataSource = new MatTableDataSource<StockPosition>([]);
  }

  ngOnInit() {
    console.log('StocksComponent initialized');
    this.loadStocks();
  }

  ngOnDestroy() {
    if (this.positionsSubscription) {
      this.positionsSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (
      data: StockPosition,
      sortHeaderId: string,
    ): string | number => {
      switch (sortHeaderId) {
        case 'currentValue':
        case 'priceAtPurchase':
        case 'currentPrice':
          return Number(data[sortHeaderId as keyof StockPosition]) || 0;
        case 'totalChange':
        case 'dailyChange':
        case 'ytdChange':
          return Number(data[sortHeaderId]) || 0;
        default:
          return String(data[sortHeaderId as keyof StockPosition] || '');
      }
    };

    this.dataSource.filterPredicate = (data: StockPosition, filter: string) => {
      const searchStr = JSON.stringify({
        stockName: data.stockName,
        symbol: data.symbol,
      }).toLowerCase();
      return searchStr.indexOf(filter.toLowerCase()) !== -1;
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadStocks() {
    console.log('Starting to load stocks...');
    this.isLoading = true;
    this.error = null;
    this.positionsSubscription = this.stockService.getPositions().subscribe({
      next: stocks => {
        console.log('Loaded stocks:', stocks);
        this.dataSource.data = stocks;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading stocks:', error);
        this.error = 'Failed to load stocks. Please try again.';
        this.isLoading = false;
      },
    });
  }

  openAddStockDialog() {
    const dialogRef = this.dialog.open(AddStockDialogComponent, {
      width: '400px',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStocks();
      }
    });
  }

  getStatusColor(value: number | null): string {
    if (value === null) return '';
    return value > 0 ? 'positive' : value < 0 ? 'negative' : '';
  }

  deleteStock(id: number) {
    if (confirm('Are you sure you want to delete this stock?')) {
      this.isLoading = true;
      this.stockService.deletePosition(id).subscribe({
        next: () => {
          this.isLoading = false;
          this.loadStocks();
        },
        error: error => {
          console.error('Error deleting stock:', error);
          this.error = 'Failed to delete stock. Please try again.';
          this.isLoading = false;
        },
      });
    }
  }
}
