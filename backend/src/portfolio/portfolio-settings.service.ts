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

@Injectable()
export class PortfolioSettingsService {
  constructor(
    @InjectRepository(PortfolioSettings)
    private settingsRepository: Repository<PortfolioSettings>,
    @InjectRepository(PriceAlert)
    private alertRepository: Repository<PriceAlert>,
  ) {}

  async getSettings(userId: number): Promise<PortfolioSettings> {
    const settings = await this.settingsRepository.findOne({
      where: { userId },
      relations: ['priceAlerts'],
    });

    if (!settings) {
      throw new NotFoundException('Portfolio settings not found');
    }

    return settings;
  }

  async updateSettings(
    userId: number,
    settingsDto: PortfolioSettingsDto,
  ): Promise<PortfolioSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ userId });
    }

    // Update basic settings
    settings.defaultCurrency = settingsDto.defaultCurrency;
    settings.emailNotifications = settingsDto.notifications.email;
    settings.pushNotifications = settingsDto.notifications.push;
    settings.notificationFrequency = settingsDto.notifications.frequency;

    // Save settings first to ensure we have an ID
    const savedSettings = await this.settingsRepository.save(settings);

    // Handle price alerts
    await this.alertRepository.delete({ settingsId: savedSettings.id });

    const alerts = settingsDto.priceAlerts.map(alert =>
      this.alertRepository.create({
        ...alert,
        settingsId: savedSettings.id,
      }),
    );

    await this.alertRepository.save(alerts);

    return this.getSettings(userId);
  }

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
