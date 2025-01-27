import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialSharedModule } from '../../shared/material-shared.module';
import { MaterialDataModule } from '../../shared/material-data.module';
import { MaterialFormsModule } from '../../shared/material-forms.module';
import {
  TransactionService,
  Transaction,
} from '../../services/transaction.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MaterialSharedModule,
    MaterialDataModule,
    MaterialFormsModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class TransactionsComponent implements OnInit {
  displayedColumns: string[] = [
    'transactionDate',
    'assetType',
    'transactionType',
    'name',
    'symbol',
    'amount',
    'pricePerUnit',
    'totalValue',
  ];
  dataSource: MatTableDataSource<Transaction>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private transactionService: TransactionService) {
    this.dataSource = new MatTableDataSource<Transaction>();
  }

  ngOnInit() {
    this.loadTransactions();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadTransactions() {
    console.log('Loading transactions...');
    this.transactionService.getTransactions().subscribe({
      next: transactions => {
        console.log('Received transactions:', transactions);
        this.dataSource.data = transactions;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      },
      error: error => {
        console.error('Error loading transactions:', error);
        if (error.status === 401) {
          console.error(
            'Authentication error - token may be invalid or expired',
          );
        } else if (error.status === 404) {
          console.error('API endpoint not found');
        } else {
          console.error('Unexpected error:', error.message);
        }
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
