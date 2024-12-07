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
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './positions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  private readonly logger = new Logger(PositionsController.name);

  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  async create(@Request() req, @Body() createPositionDto: CreatePositionDto) {
    try {
      this.logger.log('Creating new position:', createPositionDto);
      const result = await this.positionsService.create({
        ...createPositionDto,
        userId: req.user.id,
      });
      this.logger.log('Position created successfully');
      return result;
    } catch (error) {
      this.logger.error('Error creating position:', error);
      throw new HttpException(
        error.message || 'Failed to create position',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(@Request() req) {
    try {
      return await this.positionsService.findAll(req.user.id);
    } catch (error) {
      this.logger.error('Error fetching positions:', error);
      throw new HttpException(
        'Failed to fetch positions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('summary')
  async getSummary(@Request() req) {
    try {
      return await this.positionsService.getSummary(req.user.id);
    } catch (error) {
      this.logger.error('Error fetching summary:', error);
      throw new HttpException(
        'Failed to fetch summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    try {
      this.logger.log(`Deleting position ${id} for user ${req.user.id}`);
      return await this.positionsService.delete(req.user.id, parseInt(id, 10));
    } catch (error) {
      this.logger.error(`Error deleting position ${id}:`, error);
      throw new HttpException(
        error.message || 'Failed to delete position',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
