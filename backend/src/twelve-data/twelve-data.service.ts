import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface PriceResponse {
  price: string;
}

interface BatchPriceResponse {
  [symbol: string]: PriceResponse;
}

@Injectable()
export class TwelveDataService {
  private readonly logger = new Logger(TwelveDataService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twelvedata.com';
  private requestCount = 0;
  private lastRequestTime = Date.now();
  private readonly requestLimit = 8;
  private readonly timeWindow = 60000; // 1 minute in milliseconds

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

  private canMakeRequest(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime >= this.timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
      return true;
    }
    return this.requestCount < this.requestLimit;
  }

  private incrementRequestCount() {
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  async getPrice(symbol: string): Promise<number> {
    if (!this.canMakeRequest()) {
      this.logger.warn(`Rate limit exceeded for symbol: ${symbol}`);
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.incrementRequestCount();
    try {
      this.logger.log(
        `Fetching price for symbol: ${symbol} with API key: ${this.apiKey.substring(0, 4)}...`,
      );

      const url = `${this.baseUrl}/price`;
      const params = {
        symbol,
        apikey: this.apiKey,
      };

      this.logger.debug(
        `Making request to: ${url} with params: ${JSON.stringify(params)}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<PriceResponse>(url, { params }),
      );

      this.logger.debug(
        `Raw API response for ${symbol}: ${JSON.stringify(response.data)}`,
      );

      if (!response.data || !response.data.price) {
        this.logger.error(
          `Invalid response format for ${symbol}: ${JSON.stringify(response.data)}`,
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
          'Invalid price format from API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      this.logger.log(`Successfully fetched price for ${symbol}: ${price}`);
      return price;
    } catch (error: any) {
      this.logger.error(
        `Error fetching price for ${symbol}:`,
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch price data',
        error.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getPrices(symbols: string[]): Promise<Map<string, number>> {
    if (!this.canMakeRequest()) {
      this.logger.warn(
        `Rate limit exceeded for symbols: ${symbols.join(', ')}`,
      );
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.incrementRequestCount();
    try {
      const symbolString = symbols.join(',');
      this.logger.debug(`Fetching prices for symbols: ${symbolString}`);

      const response = await firstValueFrom(
        this.httpService.get<PriceResponse | BatchPriceResponse>(
          `${this.baseUrl}/price`,
          {
            params: {
              symbol: symbolString,
              apikey: this.apiKey,
            },
          },
        ),
      );

      this.logger.debug(`Raw batch response: ${JSON.stringify(response.data)}`);

      const priceMap = new Map<string, number>();
      if (symbols.length === 1) {
        const price = parseFloat((response.data as PriceResponse).price);
        this.logger.debug(`Single symbol price for ${symbols[0]}: ${price}`);
        priceMap.set(symbols[0], price);
      } else {
        const batchResponse = response.data as BatchPriceResponse;
        Object.entries(batchResponse).forEach(([symbol, data]) => {
          const price = parseFloat(data.price);
          this.logger.debug(`Batch price for ${symbol}: ${price}`);
          priceMap.set(symbol, price);
        });
      }

      this.logger.log(
        `Successfully fetched prices for ${symbols.length} symbols`,
      );
      return priceMap;
    } catch (error: any) {
      this.logger.error(
        `Error fetching batch prices:`,
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch price data',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
