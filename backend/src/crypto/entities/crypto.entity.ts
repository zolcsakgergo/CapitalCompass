import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

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

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  purchasePrice: number;

  @Column({ type: 'datetime' })
  purchaseDate: Date;

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
