import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoController } from './crypto.controller';
import { CryptoService } from './crypto.service';
import { Crypto } from './entities/crypto.entity';
import { User } from '../auth/entities/user.entity';
import { TwelveDataService } from '../twelve-data/twelve-data.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Crypto, User]), HttpModule, ConfigModule],
  controllers: [CryptoController],
  providers: [CryptoService, TwelveDataService],
})
export class CryptoModule {}
