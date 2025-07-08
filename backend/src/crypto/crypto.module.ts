import { Module } from '@nestjs/common';
import { CryptoController } from './crypto.controller';
import { CryptoService } from './crypto.service';
import { TwelveDataService } from '../twelve-data/twelve-data.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [CryptoController],
  providers: [CryptoService, TwelveDataService, PrismaService],
})
export class CryptoModule {}
