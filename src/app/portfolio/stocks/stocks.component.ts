import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,
  Injectable,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialSharedModule } from '../../shared/material-shared.module';
import { MaterialDataModule } from '../../shared/material-data.module';
import { MaterialFormsModule } from '../../shared/material-forms.module';
import { AddStockDialogComponent } from './add-stock-dialog/add-stock-dialog.component';
import { StockService } from '../../services/stock.service';
import { StockPosition } from '../../interfaces/position.interface';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Subscription, Subject } from 'rxjs';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { clearCache } from '../../interceptors/cache.interceptor';
import { takeUntil } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<any>>();

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    const cachedResponse = this.cache.get(req.url);
    if (cachedResponse) {
      return of(cachedResponse.clone());
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.url, event.clone());
        }
      }),
    );
  }
}

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [
    CommonModule,
    MaterialSharedModule,
    MaterialDataModule,
    MaterialFormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.scss'],
})
export class StocksComponent implements OnInit, OnDestroy {
  stocks: StockPosition[] = [];
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
  private destroy$ = new Subject<void>();

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
    this.destroy$.next();
    this.destroy$.complete();
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

  loadStocks(): void {
    this.isLoading = true;
    this.error = null;
    console.log('[Stocks] Making API call to load stocks');

    this.stockService
      .getPositions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: stocks => {
          this.stocks = stocks.map(stock => ({
            ...stock,
            totalValue:
              stock.shares * (stock.currentPrice ?? stock.priceAtPurchase),
            totalChange: this.calculateTotalChange(stock),
            purchaseDate: new Date(stock.dateAcquired),
          }));
          this.dataSource.data = this.stocks;
          this.isLoading = false;
          console.log('[Stocks] Successfully loaded stocks:', stocks.length);
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

  refreshStocks(): void {
    clearCache();
    this.loadStocks();
  }

  private calculateTotalChange(stock: StockPosition): number {
    const initialValue = stock.shares * stock.priceAtPurchase;
    const currentValue =
      stock.shares * (stock.currentPrice ?? stock.priceAtPurchase);
    return initialValue === 0
      ? 0
      : ((currentValue - initialValue) / initialValue) * 100;
  }
}
