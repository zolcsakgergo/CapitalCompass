import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface PriceResponse {
  price: string;
  status?: string;
  message?: string;
  code?: number;
}

@Injectable()
export class TwelveDataService {
  private readonly logger = new Logger(TwelveDataService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twelvedata.com';
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private lastRequestTime = Date.now();
  private readonly requestLimit = 8;
  private readonly timeWindow = 60000; // 1 minute in milliseconds
  private readonly retryDelay = 2000; // 2 seconds

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('TWELVE_DATA_API_KEY');
    if (!this.apiKey) {
      this.logger.error('TWELVE_DATA_API_KEY is not configured');
      throw new Error('TWELVE_DATA_API_KEY is not configured');
    }
    this.logger.log(
      `Initialized with API key: ${this.apiKey.substring(0, 4)}...`,
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private resetRequestCount() {
    const now = Date.now();
    if (now - this.lastRequestTime >= this.timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
  }

  private async waitForRateLimit(): Promise<void> {
    this.resetRequestCount();
    if (this.requestCount >= this.requestLimit) {
      const waitTime = this.timeWindow - (Date.now() - this.lastRequestTime);
      this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await this.delay(waitTime);
      this.resetRequestCount();
    }
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      await this.waitForRateLimit();
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          this.logger.error('Error processing queued request:', error);
        }
        await this.delay(this.retryDelay); // Add delay between requests
      }
    }

    this.isProcessingQueue = false;
  }

  private addToQueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  async getPrice(symbol: string): Promise<number> {
    return this.addToQueue(async () => {
      try {
        this.logger.debug(`Fetching price for symbol: ${symbol}`);
        const url = `${this.baseUrl}/price`;
        const params = {
          symbol,
          apikey: this.apiKey,
        };

        this.logger.debug(
          `Making request to: ${url} with params: ${JSON.stringify({
            ...params,
            apikey: params.apikey.substring(0, 4) + '...',
          })}`,
        );

        const response = await firstValueFrom(
          this.httpService.get<PriceResponse>(url, { params }),
        );

        this.logger.debug(
          `Raw API response for ${symbol}: ${JSON.stringify(response.data)}`,
        );

        if (response.data?.code === 429) {
          throw new HttpException(
            'Rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (response.data?.status === 'error') {
          this.logger.error(
            `API error for ${symbol}: ${JSON.stringify(response.data)}`,
          );
          throw new HttpException(
            response.data.message || 'API error',
            HttpStatus.BAD_GATEWAY,
          );
        }

        if (!response.data || !response.data.price) {
          this.logger.error(
            `Invalid response format for ${symbol}: ${JSON.stringify(
              response.data,
            )}`,
          );
          throw new HttpException(
            'Invalid response from price API',
            HttpStatus.BAD_GATEWAY,
          );
        }

        const price = parseFloat(response.data.price);
        if (isNaN(price)) {
          this.logger.error(
            `Failed to parse price for ${symbol}: ${response.data.price}`,
          );
          throw new HttpException(
            'Invalid price format',
            HttpStatus.BAD_GATEWAY,
          );
        }

        this.requestCount++;
        this.lastRequestTime = Date.now();
        this.logger.debug(`Successfully fetched price for ${symbol}: ${price}`);
        return price;
      } catch (error) {
        if (error?.response?.status === 429 || error?.status === 429) {
          this.logger.warn(
            `Rate limit exceeded for ${symbol}, will retry later`,
          );
          throw new HttpException(
            'Rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        this.logger.error(`Error fetching price for ${symbol}:`, error);
        throw new HttpException(
          'Failed to fetch price',
          HttpStatus.BAD_GATEWAY,
        );
      }
    });
  }

  async getPrices(symbols: string[]): Promise<Map<string, number>> {
    this.logger.debug(`Fetching prices for symbols: ${symbols.join(', ')}`);
    const prices = new Map<string, number>();

    for (const symbol of symbols) {
      try {
        const price = await this.getPrice(symbol);
        prices.set(symbol, price);
      } catch (error) {
        this.logger.error(`Failed to fetch price for ${symbol}:`, error);
        // Don't set a price if we failed to fetch it
      }
    }

    return prices;
  }
}
