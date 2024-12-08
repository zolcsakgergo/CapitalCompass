import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TwelveDataService } from './twelve-data.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TwelveDataService],
  exports: [TwelveDataService],
})
export class TwelveDataModule {}
