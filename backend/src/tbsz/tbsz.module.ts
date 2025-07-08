import { Module } from '@nestjs/common';
import { TbszService } from './tbsz.service';
import { TbszController } from './tbsz.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TbszController],
  providers: [TbszService, PrismaService],
  exports: [TbszService],
})
export class TbszModule {}
