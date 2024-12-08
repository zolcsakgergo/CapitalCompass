import { IsString, IsNumber, IsDateString } from 'class-validator';

export class CreateCryptoDto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  purchasePrice: number;

  @IsDateString()
  purchaseDate: string;
}
