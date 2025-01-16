import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PortfolioSettings,
  PriceAlert,
} from './entities/portfolio-settings.entity';
import {
  PortfolioSettingsDto,
  PriceAlertDto,
} from './dto/portfolio-settings.dto';

// This service manages portfolio settings and price alerts for users
@Injectable()
export class PortfolioSettingsService {
  constructor(
    // Inject TypeORM repositories to interact with the database
    @InjectRepository(PortfolioSettings)
    private settingsRepository: Repository<PortfolioSettings>,
    @InjectRepository(PriceAlert)
    private alertRepository: Repository<PriceAlert>,
  ) {}

  // Get a user's portfolio settings including their price alerts
  async getSettings(userId: number): Promise<PortfolioSettings> {
    const settings = await this.settingsRepository.findOne({
      where: { userId },
      relations: ['priceAlerts'], // Include related price alerts
    });

    if (!settings) {
      throw new NotFoundException('Portfolio settings not found');
    }

    return settings;
  }

  // Update a user's portfolio settings and price alerts
  async updateSettings(
    userId: number,
    settingsDto: PortfolioSettingsDto,
  ): Promise<PortfolioSettings> {
    // Find existing settings or create new ones
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ userId });
    }

    // Update basic settings from the DTO
    settings.defaultCurrency = settingsDto.defaultCurrency;
    settings.emailNotifications = settingsDto.notifications.email;
    settings.pushNotifications = settingsDto.notifications.push;
    settings.notificationFrequency = settingsDto.notifications.frequency;

    // Save settings to get an ID if new
    const savedSettings = await this.settingsRepository.save(settings);

    // Delete existing alerts and create new ones from the DTO
    await this.alertRepository.delete({ settingsId: savedSettings.id });

    const alerts = settingsDto.priceAlerts.map(alert =>
      this.alertRepository.create({
        ...alert,
        settingsId: savedSettings.id,
      }),
    );

    await this.alertRepository.save(alerts);

    // Return complete updated settings
    return this.getSettings(userId);
  }

  // Add a single new price alert for a user
  async addPriceAlert(
    userId: number,
    alertDto: PriceAlertDto,
  ): Promise<PriceAlert> {
    const settings = await this.getSettings(userId);

    const alert = this.alertRepository.create({
      ...alertDto,
      settingsId: settings.id,
    });

    return this.alertRepository.save(alert);
  }

  // Remove a specific price alert for a user
  async removePriceAlert(userId: number, alertId: number): Promise<void> {
    const settings = await this.getSettings(userId);
    const alert = await this.alertRepository.findOne({
      where: { id: alertId, settingsId: settings.id },
    });

    if (!alert) {
      throw new NotFoundException('Price alert not found');
    }

    await this.alertRepository.remove(alert);
  }
}
