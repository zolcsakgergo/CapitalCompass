import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getTransactions(@Request() req) {
    try {
      this.logger.log('Fetching transactions');
      const transactions = await this.transactionsService.findAll(req.user.id);
      this.logger.log(`Found ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      this.logger.error('Error fetching transactions:', error);
      throw new HttpException(
        'Failed to fetch transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createTransaction(@Request() req, @Body() createTransactionDto: any) {
    try {
      this.logger.log('Creating new transaction:', createTransactionDto);
      const result = await this.transactionsService.create(
        req.user.id,
        createTransactionDto,
      );
      this.logger.log('Transaction created successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('Error creating transaction:', error);
      throw new HttpException(
        error.message || 'Failed to create transaction',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.transactionsService.remove(req.user.id, id);
  }
}
