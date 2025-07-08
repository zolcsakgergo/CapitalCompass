import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwelveDataService } from '../twelve-data/twelve-data.service';

export interface CreateStockDto {
  userId: string;
  stockName: string;
  symbol: string;
  shares: number;
  dateAcquired: Date;
  priceAtPurchase: number;
}

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    private prisma: PrismaService,
    private twelveDataService: TwelveDataService,
  ) {}

  private async updatePriceHistory(stock: any, currentPrice: number) {
    const now = new Date();
    const lastUpdate = stock.lastPriceUpdate;

    this.logger.debug(
      `Updating price history for ${stock.symbol}:
      Current Price: ${currentPrice}
      Purchase Price: ${stock.priceAtPurchase}
      Previous Price: ${stock.currentPrice}
      Previous Day Price: ${stock.previousDayPrice}
      Year Start Price: ${stock.yearStartPrice}
      Last Update: ${lastUpdate}`,
    );

    // If this is the first update or if the last update was on a different day
    if (!lastUpdate || lastUpdate.getDate() !== now.getDate()) {
      stock.previousDayPrice = stock.currentPrice || currentPrice;
      this.logger.debug(
        `Updated previousDayPrice to: ${stock.previousDayPrice}`,
      );
    }

    // If this is the first update of the year or if we don't have a year start price
    if (
      !stock.yearStartPrice ||
      lastUpdate?.getFullYear() !== now.getFullYear()
    ) {
      stock.yearStartPrice = currentPrice;
      this.logger.debug(`Updated yearStartPrice to: ${stock.yearStartPrice}`);
    }

    stock.currentPrice = currentPrice;
    stock.lastPriceUpdate = now;

    return stock;
  }

  private formatSymbol(symbol: string): string {
    const cleanSymbol = symbol.split(':').pop() || symbol;
    return cleanSymbol.trim().toUpperCase();
  }

  async create(createStockDto: CreateStockDto) {
    try {
      const formattedSymbol = this.formatSymbol(createStockDto.symbol);
      this.logger.log(
        `Creating stock position for symbol: ${formattedSymbol} (original: ${createStockDto.symbol})`,
      );

      // Get current market price
      const currentPrice =
        await this.twelveDataService.getPrice(formattedSymbol);
      this.logger.log(
        `Current market price fetched: ${currentPrice}, Purchase price provided: ${createStockDto.priceAtPurchase}`,
      );

      const stock = await this.prisma.stock.create({
        data: {
          stockName: createStockDto.stockName,
          symbol: createStockDto.symbol,
          shares: createStockDto.shares,
          priceAtPurchase: createStockDto.priceAtPurchase,
          dateAcquired: new Date(createStockDto.dateAcquired),
          userId: createStockDto.userId,
          currentPrice,
          previousDayPrice: currentPrice,
          yearStartPrice: currentPrice,
          lastPriceUpdate: new Date(),
        },
      });

      this.logger.log('Saving stock position to database');

      // Calculate current value first (price * shares)
      const currentValue = currentPrice * Number(stock.shares);
      // Calculate initial investment value (purchase price * shares)
      const initialValue = Number(stock.priceAtPurchase) * Number(stock.shares);
      // Calculate total change based on the actual values
      const totalChange = ((currentValue - initialValue) / initialValue) * 100;

      this.logger.log(
        `Stock position saved successfully:
        ID: ${stock.id}
        Symbol: ${stock.symbol}
        Formatted Symbol: ${formattedSymbol}
        Shares: ${stock.shares}
        Price at Purchase: ${stock.priceAtPurchase}
        Current Price: ${currentPrice}
        Current Value: ${currentValue}
        Total Change: ${totalChange}%`,
      );

      return {
        ...stock,
        currentValue,
        totalChange,
        dailyChange: 0,
        ytdChange: 0,
      };
    } catch (error) {
      this.logger.error('Error creating stock position:', error);
      throw error;
    }
  }

  async findAll(userId: string) {
    const stocks = await this.prisma.stock.findMany({
      where: { userId },
    });

    if (stocks.length === 0) {
      return [];
    }

    this.logger.debug(
      `Found ${stocks.length} stock positions for user ${userId}`,
    );

    // Format symbols before fetching prices
    const symbols = [...new Set(stocks.map(p => this.formatSymbol(p.symbol)))];
    this.logger.debug(`Fetching prices for symbols: ${symbols.join(', ')}`);
    const prices = await this.twelveDataService.getPrices(symbols);

    this.logger.debug(
      'Current prices fetched:',
      Object.fromEntries(prices.entries()),
    );

    const updatedStocks = await Promise.all(
      stocks.map(async stock => {
        const formattedSymbol = this.formatSymbol(stock.symbol);
        const currentPrice = prices.get(formattedSymbol) || stock.currentPrice;

        if (!currentPrice) {
          this.logger.warn(
            `No current price available for ${formattedSymbol} (original: ${stock.symbol}), using last known price: ${stock.currentPrice}`,
          );
        }

        const updatedStock = await this.updatePriceHistory(
          stock,
          Number(currentPrice),
        );

        const savedStock = await this.prisma.stock.update({
          where: { id: stock.id },
          data: {
            currentPrice: updatedStock.currentPrice,
            previousDayPrice: updatedStock.previousDayPrice,
            yearStartPrice: updatedStock.yearStartPrice,
            lastPriceUpdate: updatedStock.lastPriceUpdate,
          },
        });

        const currentValue = Number(currentPrice) * Number(stock.shares);
        const initialValue =
          Number(stock.priceAtPurchase) * Number(stock.shares);

        // Calculate changes based on the difference between current value and initial value
        const dailyChange = stock.previousDayPrice
          ? ((Number(currentPrice) - Number(stock.previousDayPrice)) /
              Number(stock.previousDayPrice)) *
            100
          : 0;

        const ytdChange = stock.yearStartPrice
          ? ((Number(currentPrice) - Number(stock.yearStartPrice)) /
              Number(stock.yearStartPrice)) *
            100
          : 0;

        const totalChange =
          ((currentValue - initialValue) / initialValue) * 100;

        this.logger.debug(
          `Stock ${stock.symbol} (${formattedSymbol}) calculations:
          Purchase Price: ${stock.priceAtPurchase}
          Current Price: ${currentPrice}
          Shares: ${stock.shares}
          Current Value: ${currentValue}
          Initial Value: ${initialValue}
          Daily Change: ${dailyChange.toFixed(2)}%
          YTD Change: ${ytdChange.toFixed(2)}%
          Total Change: ${totalChange.toFixed(2)}%
          Previous Day Price: ${stock.previousDayPrice}
          Year Start Price: ${stock.yearStartPrice}`,
        );

        return {
          ...savedStock,
          currentPrice,
          currentValue,
          dailyChange: parseFloat(dailyChange.toFixed(2)),
          ytdChange: parseFloat(ytdChange.toFixed(2)),
          totalChange: parseFloat(totalChange.toFixed(2)),
        };
      }),
    );

    this.logger.log(`Found ${updatedStocks.length} stock positions`);
    return updatedStocks;
  }

  async delete(userId: string, id: string) {
    const stock = await this.prisma.stock.findFirst({
      where: { id, userId },
    });

    if (!stock) {
      this.logger.warn(`Stock ${id} not found for user ${userId}`);
      return;
    }

    await this.prisma.stock.delete({
      where: { id },
    });
    this.logger.debug(`Deleted stock ${id} for user ${userId}`);
  }
}
