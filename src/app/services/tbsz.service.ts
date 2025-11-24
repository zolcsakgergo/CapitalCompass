import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface TbszAccount {
  id: string;
  name: string;
  openingDate: Date;
  maturityDate: Date;
  status: 'ACTIVE' | 'MATURED' | 'CLOSED' | 'WITHDRAWN';
  initialDepositAmount: number;
  assets?: Asset[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  purchaseDate: Date;
  purchasePrice: number;
  quantity: number;
  currentValue: number;
  tbszAccountId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TbszService {
  private readonly API_URL = 'http://localhost:3000/api';
  private tbszAccountsSubject = new BehaviorSubject<TbszAccount[]>([]);

  constructor(private http: HttpClient) {
    this.loadAccounts();
  }
  loadAccounts(): void {
    this.http
      .get<TbszAccount[]>(`${this.API_URL}/tbsz`)
      .pipe(
        map(accounts => {
          return accounts.map(account => ({
            ...account,
            openingDate: new Date(account.openingDate),
            maturityDate: new Date(account.maturityDate),
            createdAt: account.createdAt
              ? new Date(account.createdAt)
              : undefined,
            updatedAt: account.updatedAt
              ? new Date(account.updatedAt)
              : undefined,
            assets: account.assets
              ? account.assets.map(asset => ({
                  ...asset,
                  purchaseDate: new Date(asset.purchaseDate),
                }))
              : [],
          }));
        }),
      )
      .subscribe({
        next: accounts => {
          this.tbszAccountsSubject.next(accounts);
        },
        error: error => {
          console.error('Error loading TBSZ accounts:', error);
        },
      });
  }

  getAccounts(): Observable<TbszAccount[]> {
    return this.tbszAccountsSubject.asObservable();
  }

  getAccount(id: string): Observable<TbszAccount> {
    return this.http.get<TbszAccount>(`${this.API_URL}/tbsz/${id}`).pipe(
      map(account => ({
        ...account,
        openingDate: new Date(account.openingDate),
        maturityDate: new Date(account.maturityDate),
        createdAt: account.createdAt ? new Date(account.createdAt) : undefined,
        updatedAt: account.updatedAt ? new Date(account.updatedAt) : undefined,
        assets: account.assets
          ? account.assets.map(asset => ({
              ...asset,
              purchaseDate: new Date(asset.purchaseDate),
            }))
          : [],
      })),
    );
  }

  createAccount(account: Partial<TbszAccount>): Observable<TbszAccount> {
    return this.http
      .post<TbszAccount>(`${this.API_URL}/tbsz`, account)
      .pipe(tap(() => this.loadAccounts()));
  }

  updateAccount(
    id: string,
    account: Partial<TbszAccount>,
  ): Observable<TbszAccount> {
    return this.http
      .put<TbszAccount>(`${this.API_URL}/tbsz/${id}`, account)
      .pipe(tap(() => this.loadAccounts()));
  }

  deleteAccount(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/tbsz/${id}`)
      .pipe(tap(() => this.loadAccounts()));
  }

  addAsset(tbszId: string, asset: Partial<Asset>): Observable<Asset> {
    return this.http
      .post<Asset>(`${this.API_URL}/tbsz/${tbszId}/assets`, asset)
      .pipe(tap(() => this.loadAccounts()));
  }

  updateAsset(
    tbszId: string,
    assetId: string,
    asset: Partial<Asset>,
  ): Observable<Asset> {
    return this.http
      .put<Asset>(`${this.API_URL}/tbsz/${tbszId}/assets/${assetId}`, asset)
      .pipe(tap(() => this.loadAccounts()));
  }

  deleteAsset(tbszId: string, assetId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.API_URL}/tbsz/${tbszId}/assets/${assetId}`)
      .pipe(tap(() => this.loadAccounts()));
  }

  calculateMaturityProgress(account: TbszAccount): number {
    const now = new Date();
    const openingDate = new Date(account.openingDate);
    const maturityDate = new Date(account.maturityDate);

    if (now >= maturityDate) {
      return 100;
    }

    const totalDuration = maturityDate.getTime() - openingDate.getTime();
    const elapsedDuration = now.getTime() - openingDate.getTime();

    return Math.floor((elapsedDuration / totalDuration) * 100);
  }

  calculateRemainingDays(account: TbszAccount): number {
    const now = new Date();
    const maturityDate = new Date(account.maturityDate);

    if (now >= maturityDate) {
      return 0;
    }

    const diffTime = maturityDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  exportToCsv(account: TbszAccount): void {
    if (!account.assets || account.assets.length === 0) {
      alert('No assets to export');
      return;
    }

    const headers = [
      'Name',
      'Symbol',
      'Type',
      'Purchase Date',
      'Purchase Price',
      'Quantity',
      'Current Value',
    ];
    const csvData = account.assets.map(asset => [
      asset.name,
      asset.symbol,
      asset.type,
      new Date(asset.purchaseDate).toLocaleDateString(),
      asset.purchasePrice,
      asset.quantity,
      asset.currentValue,
    ]);

    let csvContent = headers.join(',') + '\n';
    csvData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `tbsz_${account.name}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToJson(account: TbszAccount): void {
    const dataStr = JSON.stringify(account, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `tbsz_${account.name}_${new Date().toISOString().slice(0, 10)}.json`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
