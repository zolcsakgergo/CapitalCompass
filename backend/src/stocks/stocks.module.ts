import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TwelveDataModule } from '../twelve-data/twelve-data.module';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [HttpModule, ConfigModule, TwelveDataModule],
  controllers: [StocksController],
  providers: [StocksService, PrismaService],
})
export class StocksModule {}
