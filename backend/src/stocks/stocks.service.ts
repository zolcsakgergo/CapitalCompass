import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { TwelveDataService } from '../twelve-data/twelve-data.service';

export interface CreateStockDto {
  userId: number;
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
    @InjectRepository(Stock)
    private stocksRepository: Repository<Stock>,
    private twelveDataService: TwelveDataService,
  ) {}

  private async updatePriceHistory(stock: Stock, currentPrice: number) {
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

      const stock = this.stocksRepository.create({
        ...createStockDto,
        currentPrice,
        previousDayPrice: currentPrice,
        yearStartPrice: currentPrice,
        lastPriceUpdate: new Date(),
      });

      this.logger.log('Saving stock position to database');
      const savedStock = await this.stocksRepository.save(stock);

      // Calculate current value first (price * shares)
      const currentValue = currentPrice * savedStock.shares;
      // Calculate initial investment value (purchase price * shares)
      const initialValue = savedStock.priceAtPurchase * savedStock.shares;
      // Calculate total change based on the actual values
      const totalChange = ((currentValue - initialValue) / initialValue) * 100;

      this.logger.log(
        `Stock position saved successfully:
        ID: ${savedStock.id}
        Symbol: ${savedStock.symbol}
        Formatted Symbol: ${formattedSymbol}
        Shares: ${savedStock.shares}
        Price at Purchase: ${savedStock.priceAtPurchase}
        Current Price: ${currentPrice}
        Current Value: ${currentValue}
        Total Change: ${totalChange}%`,
      );

      return {
        ...savedStock,
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

  async findAll(userId: number) {
    const stocks = await this.stocksRepository.find({
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

        await this.updatePriceHistory(stock, currentPrice);
        const savedStock = await this.stocksRepository.save(stock);

        const currentValue = currentPrice * stock.shares;
        const initialValue = stock.priceAtPurchase * stock.shares;

        // Calculate changes based on the difference between current value and initial value
        const dailyChange = stock.previousDayPrice
          ? ((currentPrice - stock.previousDayPrice) / stock.previousDayPrice) *
            100
          : 0;

        const ytdChange = stock.yearStartPrice
          ? ((currentPrice - stock.yearStartPrice) / stock.yearStartPrice) * 100
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

    return updatedStocks;
  }

  async delete(userId: number, id: number) {
    const stock = await this.stocksRepository.findOne({
      where: { id, userId },
    });

    if (!stock) {
      throw new Error('Stock position not found');
    }

    await this.stocksRepository.remove(stock);
  }
}
