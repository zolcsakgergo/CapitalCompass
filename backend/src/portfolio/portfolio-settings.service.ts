import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PortfolioSettingsDto,
  PriceAlertDto,
} from './dto/portfolio-settings.dto';

// This service manages portfolio settings and price alerts for users
@Injectable()
export class PortfolioSettingsService {
  constructor(private prisma: PrismaService) {}

  // Get a user's portfolio settings including their price alerts
  async getSettings(userId: string) {
    const settings = await this.prisma.portfolioSettings.findFirst({
      where: { userId },
      include: { priceAlerts: true }, // Include related price alerts
    });

    if (!settings) {
      throw new NotFoundException('Portfolio settings not found');
    }

    return settings;
  }

  // Update a user's portfolio settings and price alerts
  async updateSettings(userId: string, settingsDto: PortfolioSettingsDto) {
    // Find existing settings or create new ones
    let settings = await this.prisma.portfolioSettings.findFirst({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.portfolioSettings.create({
        data: { userId },
      });
    }

    // Update basic settings from the DTO
    const updatedSettings = await this.prisma.portfolioSettings.update({
      where: { id: settings.id },
      data: {
        defaultCurrency: settingsDto.defaultCurrency,
        emailNotifications: settingsDto.notifications.email,
        pushNotifications: settingsDto.notifications.push,
        notificationFrequency: settingsDto.notifications.frequency as any,
      },
    });

    // Delete existing alerts and create new ones from the DTO
    await this.prisma.priceAlert.deleteMany({
      where: { settingsId: updatedSettings.id },
    });

    if (settingsDto.priceAlerts.length > 0) {
      await this.prisma.priceAlert.createMany({
        data: settingsDto.priceAlerts.map(alert => ({
          ...alert,
          settingsId: updatedSettings.id,
        })),
      });
    }

    // Return complete updated settings
    return this.getSettings(userId);
  }

  // Add a single new price alert for a user
  async addPriceAlert(userId: string, alertDto: PriceAlertDto) {
    const settings = await this.getSettings(userId);

    return this.prisma.priceAlert.create({
      data: {
        ...alertDto,
        settingsId: settings.id,
      },
    });
  }

  // Remove a specific price alert for a user
  async removePriceAlert(userId: string, alertId: string): Promise<void> {
    const settings = await this.getSettings(userId);
    const alert = await this.prisma.priceAlert.findFirst({
      where: { id: alertId, settingsId: settings.id },
    });

    if (!alert) {
      throw new NotFoundException('Price alert not found');
    }

    await this.prisma.priceAlert.delete({
      where: { id: alertId },
    });
  }
}
