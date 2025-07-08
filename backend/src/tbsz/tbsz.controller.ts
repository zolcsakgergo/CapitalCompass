import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  TbszService,
  CreateTbszAccountDto,
  UpdateTbszAccountDto,
} from './tbsz.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tbsz')
@UseGuards(JwtAuthGuard)
export class TbszController {
  private readonly logger = new Logger(TbszController.name);

  constructor(private readonly tbszService: TbszService) {}

  @Post()
  async createAccount(@Body() createAccountDto: any, @Request() req: any) {
    this.logger.log(`Creating TBSZ account for user: ${req.user.id}`);

    const data: CreateTbszAccountDto = {
      ...createAccountDto,
      userId: req.user.id,
    };

    return this.tbszService.createAccount(data);
  }

  @Get()
  async getAccounts(@Request() req: any) {
    this.logger.log(`Fetching TBSZ accounts for user: ${req.user.id}`);
    return this.tbszService.getAccounts(req.user.id);
  }

  @Get(':id')
  async getAccount(@Param('id') id: string, @Request() req: any) {
    this.logger.log(`Fetching TBSZ account: ${id} for user: ${req.user.id}`);
    return this.tbszService.getAccountById(req.user.id, id);
  }

  @Put(':id')
  async updateAccount(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateTbszAccountDto,
    @Request() req: any,
  ) {
    this.logger.log(`Updating TBSZ account: ${id} for user: ${req.user.id}`);
    return this.tbszService.updateAccount(req.user.id, id, updateAccountDto);
  }

  @Delete(':id')
  async deleteAccount(@Param('id') id: string, @Request() req: any) {
    this.logger.log(`Deleting TBSZ account: ${id} for user: ${req.user.id}`);
    await this.tbszService.deleteAccount(req.user.id, id);
    return { message: 'TBSZ account deleted successfully' };
  }

  // Asset management endpoints
  @Post(':id/assets')
  async addAsset(
    @Param('id') accountId: string,
    @Body() createAssetDto: any,
    @Request() req: any,
  ) {
    this.logger.log(
      `Adding asset to TBSZ account: ${accountId} for user: ${req.user.id}`,
    );
    return this.tbszService.addAsset(req.user.id, accountId, createAssetDto);
  }

  @Get(':id/assets')
  async getAssets(@Param('id') accountId: string, @Request() req: any) {
    this.logger.log(
      `Fetching assets for TBSZ account: ${accountId} for user: ${req.user.id}`,
    );
    return this.tbszService.getAssets(req.user.id, accountId);
  }

  @Get(':accountId/assets/:assetId')
  async getAsset(
    @Param('accountId') accountId: string,
    @Param('assetId') assetId: string,
    @Request() req: any,
  ) {
    this.logger.log(
      `Fetching asset: ${assetId} from TBSZ account: ${accountId} for user: ${req.user.id}`,
    );
    return this.tbszService.getAsset(req.user.id, accountId, assetId);
  }

  @Put(':accountId/assets/:assetId')
  async updateAsset(
    @Param('accountId') accountId: string,
    @Param('assetId') assetId: string,
    @Body() updateAssetDto: any,
    @Request() req: any,
  ) {
    this.logger.log(
      `Updating asset: ${assetId} in TBSZ account: ${accountId} for user: ${req.user.id}`,
    );
    return this.tbszService.updateAsset(
      req.user.id,
      accountId,
      assetId,
      updateAssetDto,
    );
  }

  @Delete(':accountId/assets/:assetId')
  async deleteAsset(
    @Param('accountId') accountId: string,
    @Param('assetId') assetId: string,
    @Request() req: any,
  ) {
    this.logger.log(
      `Deleting asset: ${assetId} from TBSZ account: ${accountId} for user: ${req.user.id}`,
    );
    await this.tbszService.deleteAsset(req.user.id, accountId, assetId);
    return { message: 'Asset deleted successfully' };
  }
}
