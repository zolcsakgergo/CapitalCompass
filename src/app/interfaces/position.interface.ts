export interface BasePosition {
  id?: number;
  userId: number;
  symbol: string;
  dateAcquired: string;
  priceAtPurchase: number;
  currentPrice?: number;
  currentValue?: number;
  totalChange?: number;
}

export interface StockPosition extends BasePosition {
  type: 'stock';
  shares: number;
  stockName: string;
  dailyChange?: number;
  ytdChange?: number;
}

export interface CryptoPosition extends BasePosition {
  type: 'crypto';
  amount: number;
  name: string;
}
