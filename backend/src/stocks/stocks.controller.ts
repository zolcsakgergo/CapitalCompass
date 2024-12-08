import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { StocksService, CreateStockDto } from './stocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stocks')
@UseGuards(JwtAuthGuard)
export class StocksController {
  private readonly logger = new Logger(StocksController.name);

  constructor(private readonly stocksService: StocksService) {}

  @Get()
  async getStocks(@Request() req) {
    try {
      this.logger.log('Fetching stock positions');
      const stocks = await this.stocksService.findAll(req.user.id);
      this.logger.log(`Found ${stocks.length} stock positions`);
      return stocks;
    } catch (error) {
      this.logger.error('Error fetching stock positions:', error);
      throw new HttpException(
        'Failed to fetch stock positions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createStock(@Request() req, @Body() createStockDto: CreateStockDto) {
    try {
      this.logger.log('Creating new stock position:', createStockDto);
      const result = await this.stocksService.create({
        ...createStockDto,
        userId: req.user.id,
      });
      this.logger.log('Stock position created successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('Error creating stock position:', error);
      throw new HttpException(
        error.message || 'Failed to create stock position',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteStock(@Request() req, @Param('id') id: string) {
    try {
      this.logger.log(`Deleting stock position ${id}`);
      return await this.stocksService.delete(req.user.id, parseInt(id, 10));
    } catch (error) {
      this.logger.error(`Error deleting stock position ${id}:`, error);
      throw new HttpException(
        error.message || 'Failed to delete stock position',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
