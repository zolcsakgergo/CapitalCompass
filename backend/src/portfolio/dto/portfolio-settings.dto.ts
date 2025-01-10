import {
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export enum AlertCondition {
  ABOVE = 'above',
  BELOW = 'below',
}

export enum NotificationFrequency {
  REALTIME = 'realtime',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export class PriceAlertDto {
  @IsString()
  @Matches(/^[A-Za-z0-9.]+$/)
  symbol: string;

  @IsNumber()
  @Min(0)
  targetPrice: number;

  @IsEnum(AlertCondition)
  condition: AlertCondition;
}

export class NotificationSettingsDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  push: boolean;

  @IsEnum(NotificationFrequency)
  frequency: NotificationFrequency;
}

export class PortfolioSettingsDto {
  @IsEnum(Currency)
  defaultCurrency: Currency;

  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications: NotificationSettingsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceAlertDto)
  priceAlerts: PriceAlertDto[];
}
