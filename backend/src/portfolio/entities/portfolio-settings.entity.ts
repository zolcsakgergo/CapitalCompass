import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';
import { Currency, NotificationFrequency } from '../dto/portfolio-settings.dto';

@Entity('portfolio_settings')
export class PortfolioSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: Currency.USD,
  })
  defaultCurrency: Currency;

  @Column({ default: false })
  emailNotifications: boolean;

  @Column({ default: false })
  pushNotifications: boolean;

  @Column({
    type: 'varchar',
    length: 10,
    default: NotificationFrequency.DAILY,
  })
  notificationFrequency: NotificationFrequency;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

@Entity('price_alerts')
export class PriceAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PortfolioSettings)
  settings: PortfolioSettings;

  @Column()
  settingsId: number;

  @Column()
  symbol: string;

  @Column('decimal', { precision: 10, scale: 2 })
  targetPrice: number;

  @Column({
    type: 'varchar',
    length: 5,
  })
  condition: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
