import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CryptoModule } from './crypto/crypto.module';
import { AuthModule } from './auth/auth.module';
import { StocksModule } from './stocks/stocks.module';
import { TwelveDataModule } from './twelve-data/twelve-data.module';
import { Crypto } from './crypto/entities/crypto.entity';
import { User } from './auth/entities/user.entity';
import { Stock } from './stocks/entities/stock.entity';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', 'db.sqlite'),
      entities: [User, Crypto, Stock],
      synchronize: true,
    }),
    CryptoModule,
    AuthModule,
    StocksModule,
    TwelveDataModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
