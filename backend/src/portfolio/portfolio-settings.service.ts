import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PortfolioSettingsDto,
  PriceAlertDto,
} from './dto/portfolio-settings.dto';

@Injectable()
export class PortfolioSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: string) {
    const settings = await this.prisma.portfolioSettings.findFirst({
      where: { userId },
      include: { priceAlerts: true },
    });

    if (!settings) {
      throw new NotFoundException('Portfolio settings not found');
    }

    return settings;
  }

  async updateSettings(userId: string, settingsDto: PortfolioSettingsDto) {
    let settings = await this.prisma.portfolioSettings.findFirst({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.portfolioSettings.create({
        data: { userId },
      });
    }

    const updatedSettings = await this.prisma.portfolioSettings.update({
      where: { id: settings.id },
      data: {
        defaultCurrency: settingsDto.defaultCurrency,
        emailNotifications: settingsDto.notifications.email,
        pushNotifications: settingsDto.notifications.push,
        notificationFrequency: settingsDto.notifications.frequency as any,
      },
    });

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

    return this.getSettings(userId);
  }

  async addPriceAlert(userId: string, alertDto: PriceAlertDto) {
    const settings = await this.getSettings(userId);

    return this.prisma.priceAlert.create({
      data: {
        ...alertDto,
        settingsId: settings.id,
      },
    });
  }

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
