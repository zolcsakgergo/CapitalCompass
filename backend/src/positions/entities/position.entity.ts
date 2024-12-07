import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column()
  type: string;

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
