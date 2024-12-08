import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TwelveDataModule } from '../twelve-data/twelve-data.module';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { Stock } from './entities/stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock]),
    HttpModule,
    ConfigModule,
    TwelveDataModule,
  ],
  controllers: [StocksController],
  providers: [StocksService],
})
export class StocksModule {}
