import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crypto } from './entities/crypto.entity';
import { User } from '../users/user.entity';
import { TwelveDataService } from '../twelve-data/twelve-data.service';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);

  constructor(
    @InjectRepository(Crypto)
    private cryptoRepository: Repository<Crypto>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private twelveDataService: TwelveDataService,
  ) {}

  async findAll(userId: number): Promise<Crypto[]> {
    const cryptos = await this.cryptoRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });

    if (cryptos.length === 0) {
      return [];
    }

    // Format symbols for Twelve Data API (e.g., BTC/USD)
    const symbols = cryptos.map(crypto => `${crypto.symbol}/USD`);
    this.logger.debug(`Fetching prices for symbols: ${symbols.join(', ')}`);

    try {
      const prices = await this.twelveDataService.getPrices(symbols);

      const updatedCryptos = cryptos.map(crypto => {
        const currentPrice = prices.get(`${crypto.symbol}/USD`);

        // Only update if we got a valid new price
        if (currentPrice && !isNaN(currentPrice)) {
          this.logger.debug(
            `Updating ${crypto.symbol} with new price: ${currentPrice}`,
          );

          // Calculate current value (current market price * amount)
          const currentValue = Number(
            (currentPrice * crypto.amount).toFixed(2),
          );

          // Calculate total change with bounds checking and precision handling
          let totalChange = 0;
          if (crypto.priceAtPurchase > 0) {
            const initialValue = crypto.priceAtPurchase * crypto.amount;
            if (initialValue > 0) {
              totalChange = Number(
                (((currentValue - initialValue) / initialValue) * 100).toFixed(
                  2,
                ),
              );
              // Ensure the value is within SQLite's decimal bounds
              totalChange = Math.max(
                Math.min(totalChange, 999999.99),
                -999999.99,
              );
            }
          }

          return {
            ...crypto,
            currentPrice: Number(currentPrice.toFixed(2)),
            currentValue,
            totalChange,
          };
        } else {
          this.logger.debug(
            `Keeping existing values for ${crypto.symbol} (currentPrice: ${crypto.currentPrice})`,
          );
          // Keep existing values if we couldn't get a new price
          return crypto;
        }
      });

      // Only save cryptos that got valid price updates
      const cryptosToUpdate = updatedCryptos.filter(
        crypto => crypto.currentPrice && !isNaN(crypto.currentPrice),
      );

      if (cryptosToUpdate.length > 0) {
        await this.cryptoRepository.save(cryptosToUpdate);
        this.logger.debug(
          `Updated prices for ${cryptosToUpdate.length} cryptos`,
        );
      }

      return updatedCryptos;
    } catch (error) {
      this.logger.error('Error updating crypto prices:', error);
      // Return existing data if price update fails
      return cryptos;
    }
  }

  async create(data: Partial<Crypto>): Promise<Crypto> {
    this.logger.debug(`Creating crypto for user ID: ${data.userId}`);

    const user = await this.userRepository.findOne({
      where: { id: data.userId },
    });

    if (!user) {
      this.logger.error(`User not found with ID: ${data.userId}`);
      throw new NotFoundException(`User not found with ID: ${data.userId}`);
    }

    try {
      // Get current market price with proper symbol format
      const currentPrice = await this.twelveDataService.getPrice(
        `${data.symbol}/USD`,
      );

      if (currentPrice && !isNaN(currentPrice)) {
        this.logger.debug(
          `Creating crypto ${data.symbol} with current price: ${currentPrice}`,
        );

        // Calculate current value (current market price * amount)
        const currentValue = Number((currentPrice * data.amount).toFixed(2));

        // Calculate total change with bounds checking and precision handling
        let totalChange = 0;
        if (data.priceAtPurchase > 0) {
          const initialValue = data.priceAtPurchase * data.amount;
          if (initialValue > 0) {
            totalChange = Number(
              (((currentValue - initialValue) / initialValue) * 100).toFixed(2),
            );
            // Ensure the value is within SQLite's decimal bounds
            totalChange = Math.max(
              Math.min(totalChange, 999999.99),
              -999999.99,
            );
          }
        }

        const crypto = this.cryptoRepository.create({
          ...data,
          user,
          currentPrice: Number(currentPrice.toFixed(2)),
          currentValue,
          totalChange,
        });

        return this.cryptoRepository.save(crypto);
      } else {
        // If we can't get current price, create with purchase price as current price
        this.logger.warn(
          `Could not get current price for ${data.symbol}, using purchase price`,
        );
        const crypto = this.cryptoRepository.create({
          ...data,
          user,
          currentPrice: data.priceAtPurchase,
          currentValue: data.priceAtPurchase * data.amount,
          totalChange: 0,
        });

        return this.cryptoRepository.save(crypto);
      }
    } catch (error) {
      this.logger.error(`Error creating crypto ${data.symbol}:`, error);
      // Create with purchase price if price fetch fails
      const crypto = this.cryptoRepository.create({
        ...data,
        user,
        currentPrice: data.priceAtPurchase,
        currentValue: data.priceAtPurchase * data.amount,
        totalChange: 0,
      });
      return this.cryptoRepository.save(crypto);
    }
  }

  async delete(userId: number, id: number): Promise<void> {
    const crypto = await this.cryptoRepository.findOne({
      where: { id, userId },
    });

    if (!crypto) {
      this.logger.warn(`Crypto ${id} not found for user ${userId}`);
      return;
    }

    await this.cryptoRepository.remove(crypto);
    this.logger.debug(`Deleted crypto ${id} for user ${userId}`);
  }
}
