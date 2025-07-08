import { Module } from '@nestjs/common';
import { PortfolioSettingsService } from './portfolio-settings.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [PortfolioSettingsService, PrismaService],
  exports: [PortfolioSettingsService],
})
export class PortfolioModule {}
