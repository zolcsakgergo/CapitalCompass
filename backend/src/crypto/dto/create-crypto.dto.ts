import { IsString, IsNumber, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateCryptoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  priceAtPurchase: number;

  @IsDateString()
  @IsNotEmpty()
  dateAcquired: string;

  @IsString()
  @IsNotEmpty()
  type: string = 'crypto';
}
