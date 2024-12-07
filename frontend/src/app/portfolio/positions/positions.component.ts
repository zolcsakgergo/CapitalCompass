import { Component, OnInit, ViewChild } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { PositionService } from '../../services/position.service';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
  ],
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.css'],
})
export class PositionsComponent implements OnInit {
  dataSource: any[] = [];
  displayedColumns = [
    'Stock Name',
    'Symbol',
    'Shares',
    'Date Acquired',
    'Type',
    'Purchase Price',
    'Current Price',
    'Current Value',
    'Change',
    'Daily Change',
    'YTD Change',
    'actions',
  ];

  constructor(
    private positionService: PositionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadPositions();
  }

  loadPositions() {
    this.positionService.getPositions().subscribe({
      next: positions => {
        this.dataSource = positions;
      },
      error: error => {
        console.error('Error loading positions:', error);
        this.snackBar.open('Failed to load positions', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  deletePosition(id: number) {
    if (confirm('Are you sure you want to delete this position?')) {
      this.positionService.deletePosition(id).subscribe({
        next: () => {
          this.snackBar.open('Position deleted successfully', 'Close', {
            duration: 3000,
          });
          this.loadPositions(); // Reload the positions after deletion
        },
        error: error => {
          console.error('Error deleting position:', error);
          this.snackBar.open('Failed to delete position', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }
}
