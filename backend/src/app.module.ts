import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PositionsModule } from './positions/positions.module';
import { Position } from './positions/entities/position.entity';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Position],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    PositionsModule,
  ],
})
export class AppModule {}
