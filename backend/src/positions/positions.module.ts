import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';
import { Position } from './entities/position.entity';
import { TwelveDataService } from '../twelve-data/twelve-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([Position]), HttpModule, ConfigModule],
  controllers: [PositionsController],
  providers: [PositionsService, TwelveDataService],
})
export class PositionsModule {}
