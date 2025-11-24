import { Injectable } from '@angular/core';

export interface PortfolioSnapshot {
  date: Date;
  totalValue: number;
  stockValue: number;
  cryptoValue: number;
  totalGainLoss: number;
  percentageReturn: number;
}

export interface AssetPerformance {
  name: string;
  symbol: string;
  type: 'stock' | 'crypto';
  initialValue: number;
  currentValue: number;
  gainLoss: number;
  percentageReturn: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class PortfolioAnalyticsService {
  generateHistoricalSnapshots(
    stockPositions: any[],
    cryptoPositions: any[],
    months: number = 12,
  ): PortfolioSnapshot[] {
    const snapshots: PortfolioSnapshot[] = [];
    const now = new Date();

    for (let i = months; i >= 0; i--) {
      const snapshotDate = new Date(now);
      snapshotDate.setMonth(snapshotDate.getMonth() - i);

      const progressFactor = 1 - i / months;

      let stockValue = 0;
      let stockInitialValue = 0;

      stockPositions.forEach(stock => {
        const currentValue =
          stock.shares * (stock.currentPrice ?? stock.priceAtPurchase);
        const initialValue = stock.shares * stock.priceAtPurchase;
        const gain = currentValue - initialValue;

        const historicalValue = initialValue + gain * progressFactor;
        stockValue += historicalValue;
        stockInitialValue += initialValue;
      });

      let cryptoValue = 0;
      let cryptoInitialValue = 0;

      cryptoPositions.forEach(crypto => {
        const currentValue =
          crypto.amount * (crypto.currentPrice ?? crypto.priceAtPurchase);
        const initialValue = crypto.amount * crypto.priceAtPurchase;
        const gain = currentValue - initialValue;

        const historicalValue = initialValue + gain * progressFactor;
        cryptoValue += historicalValue;
        cryptoInitialValue += initialValue;
      });

      const totalValue = stockValue + cryptoValue;
      const totalInitialValue = stockInitialValue + cryptoInitialValue;
      const totalGainLoss = totalValue - totalInitialValue;
      const percentageReturn =
        totalInitialValue > 0 ? (totalGainLoss / totalInitialValue) * 100 : 0;

      snapshots.push({
        date: snapshotDate,
        totalValue,
        stockValue,
        cryptoValue,
        totalGainLoss,
        percentageReturn,
      });
    }

    return snapshots;
  }

  calculateAssetPerformance(
    stockPositions: any[],
    cryptoPositions: any[],
  ): AssetPerformance[] {
    const performances: AssetPerformance[] = [];

    stockPositions.forEach(stock => {
      const currentValue =
        stock.shares * (stock.currentPrice ?? stock.priceAtPurchase);
      const initialValue = stock.shares * stock.priceAtPurchase;
      const gainLoss = currentValue - initialValue;
      const percentageReturn =
        initialValue > 0 ? (gainLoss / initialValue) * 100 : 0;

      performances.push({
        name: stock.stockName,
        symbol: stock.symbol,
        type: 'stock',
        initialValue,
        currentValue,
        gainLoss,
        percentageReturn,
        quantity: stock.shares,
      });
    });

    cryptoPositions.forEach(crypto => {
      const currentValue =
        crypto.amount * (crypto.currentPrice ?? crypto.priceAtPurchase);
      const initialValue = crypto.amount * crypto.priceAtPurchase;
      const gainLoss = currentValue - initialValue;
      const percentageReturn =
        initialValue > 0 ? (gainLoss / initialValue) * 100 : 0;

      performances.push({
        name: crypto.name,
        symbol: crypto.symbol,
        type: 'crypto',
        initialValue,
        currentValue,
        gainLoss,
        percentageReturn,
        quantity: crypto.amount,
      });
    });

    return performances.sort((a, b) => b.percentageReturn - a.percentageReturn);
  }

  calculateMonthlyReturns(
    snapshots: PortfolioSnapshot[],
  ): { month: string; return: number }[] {
    const returns: { month: string; return: number }[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = snapshots[i - 1].totalValue;
      const currValue = snapshots[i].totalValue;
      const monthReturn =
        prevValue > 0 ? ((currValue - prevValue) / prevValue) * 100 : 0;

      const date = snapshots[i].date;
      const month = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      returns.push({
        month,
        return: monthReturn,
      });
    }

    return returns;
  }

  calculateCumulativeReturns(snapshots: PortfolioSnapshot[]): number[] {
    if (snapshots.length === 0) return [];

    const initialValue = snapshots[0].totalValue;
    return snapshots.map(snapshot => {
      return initialValue > 0
        ? ((snapshot.totalValue - initialValue) / initialValue) * 100
        : 0;
    });
  }

  calculateVolatility(snapshots: PortfolioSnapshot[]): number {
    if (snapshots.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = snapshots[i - 1].totalValue;
      const currValue = snapshots[i].totalValue;
      const returnRate =
        prevValue > 0 ? (currValue - prevValue) / prevValue : 0;
      returns.push(returnRate);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;
    const stdDev = Math.sqrt(variance);

    return stdDev * 100 * Math.sqrt(12);
  }
}
