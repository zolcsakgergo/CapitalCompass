import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: number;

  @Column()
  stockName: string;

  @Column()
  symbol: string;

  @Column('decimal', { precision: 10, scale: 2 })
  shares: number;

  @Column({ type: 'datetime' })
  dateAcquired: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  priceAtPurchase: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  previousDayPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  yearStartPrice: number;

  @Column({ type: 'datetime', nullable: true })
  lastPriceUpdate: Date;
}
