import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './entities/position.entity';
import { TwelveDataService } from '../twelve-data/twelve-data.service';

export interface CreatePositionDto {
  userId: number;
  stockName: string;
  symbol: string;
  shares: number;
  dateAcquired: Date;
  type: string;
  priceAtPurchase: number;
}

@Injectable()
export class PositionsService {
  private readonly logger = new Logger(PositionsService.name);

  constructor(
    @InjectRepository(Position)
    private positionsRepository: Repository<Position>,
    private twelveDataService: TwelveDataService,
  ) {}

  private async updatePriceHistory(position: Position, currentPrice: number) {
    const now = new Date();
    const lastUpdate = position.lastPriceUpdate;

    this.logger.debug(
      `Updating price history for ${position.symbol}:
      Current Price: ${currentPrice}
      Purchase Price: ${position.priceAtPurchase}
      Previous Price: ${position.currentPrice}
      Previous Day Price: ${position.previousDayPrice}
      Year Start Price: ${position.yearStartPrice}
      Last Update: ${lastUpdate}`,
    );

    // If this is the first update or if the last update was on a different day
    if (!lastUpdate || lastUpdate.getDate() !== now.getDate()) {
      position.previousDayPrice = position.currentPrice || currentPrice;
      this.logger.debug(
        `Updated previousDayPrice to: ${position.previousDayPrice}`,
      );
    }

    // If this is the first update of the year or if we don't have a year start price
    if (
      !position.yearStartPrice ||
      lastUpdate?.getFullYear() !== now.getFullYear()
    ) {
      position.yearStartPrice = currentPrice;
      this.logger.debug(
        `Updated yearStartPrice to: ${position.yearStartPrice}`,
      );
    }

    position.currentPrice = currentPrice;
    position.lastPriceUpdate = now;

    return position;
  }

  async create(createPositionDto: CreatePositionDto) {
    try {
      this.logger.log(
        `Creating position for symbol: ${createPositionDto.symbol}`,
      );

      // Get current market price
      const currentPrice = await this.twelveDataService.getPrice(
        createPositionDto.symbol,
      );
      this.logger.log(
        `Current market price fetched: ${currentPrice}, Purchase price provided: ${createPositionDto.priceAtPurchase}`,
      );

      const position = this.positionsRepository.create({
        ...createPositionDto,
        currentPrice,
        previousDayPrice: currentPrice, // Initialize with current price
        yearStartPrice: currentPrice, // Initialize with current price
        lastPriceUpdate: new Date(),
      });

      this.logger.log('Saving position to database');
      const savedPosition = await this.positionsRepository.save(position);

      // Calculate initial changes
      const totalChange =
        ((currentPrice - savedPosition.priceAtPurchase) /
          savedPosition.priceAtPurchase) *
        100;
      const currentValue = currentPrice * savedPosition.shares;

      this.logger.log(
        `Position saved successfully:
        ID: ${savedPosition.id}
        Symbol: ${savedPosition.symbol}
        Shares: ${savedPosition.shares}
        Price at Purchase: ${savedPosition.priceAtPurchase}
        Current Price: ${currentPrice}
        Current Value: ${currentValue}
        Total Change: ${totalChange}%`,
      );

      return {
        ...savedPosition,
        currentValue,
        totalChange,
        dailyChange: 0, // First day, so no daily change yet
        ytdChange: 0, // First position, so YTD starts from here
      };
    } catch (error) {
      this.logger.error('Error creating position:', error);
      throw error;
    }
  }

  async findAll(userId: number) {
    const positions = await this.positionsRepository.find({
      where: { userId },
    });

    if (positions.length === 0) {
      return [];
    }

    this.logger.debug(`Found ${positions.length} positions for user ${userId}`);

    const symbols = [...new Set(positions.map(p => p.symbol))];
    this.logger.debug(`Fetching prices for symbols: ${symbols.join(', ')}`);
    const prices = await this.twelveDataService.getPrices(symbols);

    this.logger.debug(
      'Current prices fetched:',
      Object.fromEntries(prices.entries()),
    );

    const updatedPositions = await Promise.all(
      positions.map(async position => {
        const currentPrice =
          prices.get(position.symbol) || position.currentPrice;

        if (!currentPrice) {
          this.logger.warn(
            `No current price available for ${position.symbol}, using last known price: ${position.currentPrice}`,
          );
        }

        await this.updatePriceHistory(position, currentPrice);
        const savedPosition = await this.positionsRepository.save(position);

        const currentValue = currentPrice * position.shares;

        // Calculate changes based on the difference between current price and respective base prices
        const dailyChange = position.previousDayPrice
          ? ((currentPrice - position.previousDayPrice) /
              position.previousDayPrice) *
            100
          : 0;

        const ytdChange = position.yearStartPrice
          ? ((currentPrice - position.yearStartPrice) /
              position.yearStartPrice) *
            100
          : 0;

        const totalChange =
          ((currentPrice - position.priceAtPurchase) /
            position.priceAtPurchase) *
          100;

        this.logger.debug(
          `Position ${position.symbol} calculations:
          Purchase Price: ${position.priceAtPurchase}
          Current Price: ${currentPrice}
          Shares: ${position.shares}
          Current Value: ${currentValue}
          Daily Change: ${dailyChange.toFixed(2)}%
          YTD Change: ${ytdChange.toFixed(2)}%
          Total Change: ${totalChange.toFixed(2)}%
          Previous Day Price: ${position.previousDayPrice}
          Year Start Price: ${position.yearStartPrice}`,
        );

        return {
          ...savedPosition,
          currentPrice,
          currentValue,
          dailyChange: parseFloat(dailyChange.toFixed(2)),
          ytdChange: parseFloat(ytdChange.toFixed(2)),
          totalChange: parseFloat(totalChange.toFixed(2)),
        };
      }),
    );

    return updatedPositions;
  }

  async getSummary(userId: number) {
    const positions = await this.findAll(userId);

    if (positions.length === 0) {
      return {
        totalValue: 0,
        totalPositions: 0,
        dailyChange: 0,
        ytdChange: 0,
      };
    }

    const totalValue = positions.reduce(
      (sum, pos) => sum + (pos.currentValue || 0),
      0,
    );

    const dailyChange =
      positions.reduce((sum, pos) => sum + (pos.dailyChange || 0), 0) /
      positions.length;
    const ytdChange =
      positions.reduce((sum, pos) => sum + (pos.ytdChange || 0), 0) /
      positions.length;

    this.logger.debug(
      `Portfolio summary for user ${userId}:
      Total Value: ${totalValue}
      Total Positions: ${positions.length}
      Daily Change: ${dailyChange}%
      YTD Change: ${ytdChange}%
      Individual position values: ${positions
        .map(
          p =>
            `${p.symbol}: ${p.currentValue} (${p.totalChange >= 0 ? '+' : ''}${
              p.totalChange
            }%)`,
        )
        .join(', ')}`,
    );

    return {
      totalValue,
      totalPositions: positions.length,
      dailyChange,
      ytdChange,
    };
  }

  async delete(userId: number, positionId: number) {
    this.logger.log(
      `Attempting to delete position ${positionId} for user ${userId}`,
    );

    const position = await this.positionsRepository.findOne({
      where: { id: positionId, userId },
    });

    if (!position) {
      this.logger.warn(`Position ${positionId} not found for user ${userId}`);
      throw new Error('Position not found');
    }

    this.logger.log(
      `Deleting position: ${position.symbol} (ID: ${positionId})`,
    );
    await this.positionsRepository.remove(position);

    return { success: true, message: 'Position deleted successfully' };
  }
}
