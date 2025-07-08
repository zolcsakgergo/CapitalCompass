import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CreateCryptoDto } from './dto/create-crypto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('crypto')
@UseGuards(JwtAuthGuard)
export class CryptoController {
  private readonly logger = new Logger(CryptoController.name);

  constructor(private readonly cryptoService: CryptoService) {}

  @Get()
  async getCryptoPositions(@Request() req) {
    try {
      this.logger.log('Fetching crypto positions');
      const positions = await this.cryptoService.findAll(req.user.id);
      this.logger.log(`Found ${positions.length} crypto positions`);
      return positions;
    } catch (error) {
      this.logger.error('Error fetching crypto positions:', error);
      throw new HttpException(
        'Failed to fetch crypto positions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createCryptoPosition(
    @Request() req,
    @Body() createCryptoDto: CreateCryptoDto,
  ) {
    try {
      this.logger.log('Creating new crypto position:', createCryptoDto);
      const result = await this.cryptoService.create({
        ...createCryptoDto,
        userId: req.user.id,
        dateAcquired: new Date(createCryptoDto.dateAcquired),
      });
      this.logger.log('Crypto position created successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('Error creating crypto position:', error);
      throw new HttpException(
        error.message || 'Failed to create crypto position',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteCryptoPosition(@Request() req, @Param('id') id: string) {
    try {
      this.logger.log(`Deleting crypto position ${id}`);
      return await this.cryptoService.delete(req.user.id, id);
    } catch (error) {
      this.logger.error(`Error deleting crypto position ${id}:`, error);
      throw new HttpException(
        error.message || 'Failed to delete crypto position',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
