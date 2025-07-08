import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTbszAccountDto {
  name: string;
  openingDate: Date;
  maturityDate: Date;
  status: string;
  initialDepositAmount: number;
  userId: string;
}

export interface UpdateTbszAccountDto {
  name?: string;
  status?: string;
  initialDepositAmount?: number;
}

export interface CreateAssetDto {
  name: string;
  symbol?: string;
  type: string;
  purchaseDate: Date;
  purchasePrice: number;
  quantity: number;
  currentValue?: number;
}

export interface UpdateAssetDto {
  name?: string;
  symbol?: string;
  type?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  quantity?: number;
  currentValue?: number;
}

@Injectable()
export class TbszService {
  private readonly logger = new Logger(TbszService.name);

  constructor(private prisma: PrismaService) {}

  async createAccount(data: CreateTbszAccountDto) {
    this.logger.log(`Creating TBSZ account for user: ${data.userId}`);

    return this.prisma.tbszAccount.create({
      data: {
        name: data.name,
        openingDate: data.openingDate,
        maturityDate: data.maturityDate,
        status: data.status,
        initialDepositAmount: data.initialDepositAmount,
        userId: data.userId,
      },
      include: {
        assets: true,
      },
    });
  }

  async getAccounts(userId: string) {
    this.logger.log(`Fetching TBSZ accounts for user: ${userId}`);

    return this.prisma.tbszAccount.findMany({
      where: { userId },
      include: {
        assets: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccountById(userId: string, accountId: string) {
    this.logger.log(`Fetching TBSZ account: ${accountId} for user: ${userId}`);

    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
      include: {
        assets: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    return account;
  }

  async updateAccount(
    userId: string,
    accountId: string,
    data: UpdateTbszAccountDto,
  ) {
    this.logger.log(`Updating TBSZ account: ${accountId} for user: ${userId}`);

    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    return this.prisma.tbszAccount.update({
      where: { id: accountId },
      data,
      include: {
        assets: true,
      },
    });
  }

  async deleteAccount(userId: string, accountId: string) {
    this.logger.log(`Deleting TBSZ account: ${accountId} for user: ${userId}`);

    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    await this.prisma.tbszAccount.delete({
      where: { id: accountId },
    });
  }

  calculateMaturityProgress(account: any): number {
    const now = new Date();
    const openingDate = new Date(account.openingDate);
    const maturityDate = new Date(account.maturityDate);

    const totalDays =
      (maturityDate.getTime() - openingDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays =
      (now.getTime() - openingDate.getTime()) / (1000 * 60 * 60 * 24);

    const progress = Math.min(
      Math.max((elapsedDays / totalDays) * 100, 0),
      100,
    );
    return Math.round(progress * 100) / 100; // Round to 2 decimal places
  }

  calculateRemainingDays(account: any): number {
    const now = new Date();
    const maturityDate = new Date(account.maturityDate);

    const remainingDays =
      (maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(Math.ceil(remainingDays), 0);
  }

  // Asset management methods
  async addAsset(userId: string, accountId: string, data: CreateAssetDto) {
    this.logger.log(
      `Adding asset to TBSZ account: ${accountId} for user: ${userId}`,
    );

    // Verify the account belongs to the user
    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    return this.prisma.asset.create({
      data: {
        name: data.name,
        symbol: data.symbol || '',
        type: data.type as any, // Cast to AssetType enum
        purchaseDate: new Date(data.purchaseDate),
        purchasePrice: data.purchasePrice,
        quantity: data.quantity,
        currentValue: data.currentValue || data.purchasePrice * data.quantity,
        tbszAccountId: accountId,
      },
    });
  }

  async getAssets(userId: string, accountId: string) {
    this.logger.log(
      `Fetching assets for TBSZ account: ${accountId} for user: ${userId}`,
    );

    // Verify the account belongs to the user
    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    return this.prisma.asset.findMany({
      where: { tbszAccountId: accountId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsset(userId: string, accountId: string, assetId: string) {
    this.logger.log(
      `Fetching asset: ${assetId} from TBSZ account: ${accountId} for user: ${userId}`,
    );

    // Verify the account belongs to the user
    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, tbszAccountId: accountId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset not found`);
    }

    return asset;
  }

  async updateAsset(
    userId: string,
    accountId: string,
    assetId: string,
    data: UpdateAssetDto,
  ) {
    this.logger.log(
      `Updating asset: ${assetId} in TBSZ account: ${accountId} for user: ${userId}`,
    );

    // Verify the account belongs to the user
    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    // Verify the asset exists and belongs to the account
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, tbszAccountId: accountId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset not found`);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.type !== undefined) updateData.type = data.type as any; // Cast to AssetType enum
    if (data.purchaseDate !== undefined)
      updateData.purchaseDate = new Date(data.purchaseDate);
    if (data.purchasePrice !== undefined)
      updateData.purchasePrice = data.purchasePrice;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.currentValue !== undefined)
      updateData.currentValue = data.currentValue;

    return this.prisma.asset.update({
      where: { id: assetId },
      data: updateData,
    });
  }

  async deleteAsset(userId: string, accountId: string, assetId: string) {
    this.logger.log(
      `Deleting asset: ${assetId} from TBSZ account: ${accountId} for user: ${userId}`,
    );

    // Verify the account belongs to the user
    const account = await this.prisma.tbszAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException(`TBSZ account not found`);
    }

    // Verify the asset exists and belongs to the account
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, tbszAccountId: accountId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset not found`);
    }

    await this.prisma.asset.delete({
      where: { id: assetId },
    });
  }
}
