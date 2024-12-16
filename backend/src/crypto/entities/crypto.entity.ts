import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('cryptos')
export class Crypto {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.cryptos)
  user: User;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  symbol: string;

  @Column('decimal', { precision: 10, scale: 8 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: false })
  priceAtPurchase: number;

  @Column({ type: 'datetime', nullable: false })
  dateAcquired: Date;

  @Column({ default: 'crypto' })
  type: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentValue: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalChange: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
