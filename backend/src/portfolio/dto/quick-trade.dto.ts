import { IsEnum, IsNumber, IsString, Min, Matches } from 'class-validator';

export enum AssetType {
  STOCK = 'stock',
  CRYPTO = 'crypto',
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
}

export class QuickTradeDto {
  @IsEnum(AssetType)
  assetType: AssetType;

  @IsString()
  @Matches(/^[A-Za-z0-9.]+$/)
  symbol: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsEnum(TradeType)
  tradeType: TradeType;
}
