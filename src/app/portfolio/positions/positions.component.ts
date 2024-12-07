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
import { AddPositionDialogComponent } from './add-position-dialog/add-position-dialog.component';
import { PositionService, Position } from '../../services/position.service';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-positions',
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
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.css'],
})
export class PositionsComponent implements OnInit, OnDestroy {
  dataSource: MatTableDataSource<Position>;
  displayedColumns: string[] = [
    'stockName',
    'symbol',
    'shares',
    'dateAcquired',
    'type',
    'priceAtPurchase',
    'currentPrice',
    'currentValue',
    'change',
    'dailyChange',
    'ytdChange',
    'actions',
  ];
  isLoading = false;
  error: string | null = null;
  private positionsSubscription: Subscription | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<Position>;

  constructor(
    private dialog: MatDialog,
    private positionService: PositionService,
  ) {
    this.dataSource = new MatTableDataSource<Position>([]);
  }

  ngOnInit() {
    this.loadPositions();
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
      data: Position,
      sortHeaderId: string,
    ): string | number => {
      switch (sortHeaderId) {
        case 'currentValue':
        case 'priceAtPurchase':
        case 'currentPrice':
          return Number(data[sortHeaderId as keyof Position]) || 0;
        case 'change':
          return Number(data.totalChange) || 0;
        case 'dailyChange':
        case 'ytdChange':
          return Number(data[sortHeaderId]) || 0;
        default:
          return String(data[sortHeaderId as keyof Position] || '');
      }
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  loadPositions() {
    this.isLoading = true;
    this.error = null;
    this.positionsSubscription = this.positionService.getPositions().subscribe({
      next: positions => {
        this.dataSource.data = positions;
        this.isLoading = false;
      },
      error: error => {
        console.error('Error loading positions:', error);
        this.error = 'Failed to load positions. Please try again.';
        this.isLoading = false;
      },
    });
  }

  openAddPositionDialog() {
    const dialogRef = this.dialog.open(AddPositionDialogComponent, {
      width: '500px',
      panelClass: 'add-position-dialog',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.positionService.forceRefresh();
      }
    });
  }

  getStatusColor(value: number | null): string {
    if (value === null) return '';
    return value > 0 ? 'positive' : value < 0 ? 'negative' : '';
  }

  deletePosition(id: number) {
    if (confirm('Are you sure you want to delete this position?')) {
      this.isLoading = true;
      this.positionService.deletePosition(id).subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: error => {
          console.error('Error deleting position:', error);
          this.error = 'Failed to delete position. Please try again.';
          this.isLoading = false;
        },
      });
    }
  }
}
