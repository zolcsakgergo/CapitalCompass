import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, Logger } from '@nestjs/common';
import { TbszService, CreateTbszAccountDto } from './tbsz.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TbszService', () => {
  let service: TbszService;
  let prismaService: PrismaService;

  const mockTbszAccount = {
    id: 'tbsz-123',
    name: 'TBSZ 2023',
    openingDate: new Date('2023-01-15'),
    maturityDate: new Date('2028-01-15'),
    status: 'ACTIVE',
    initialDepositAmount: 1000000,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    assets: [],
  };

  const mockAsset = {
    id: 'asset-123',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'STOCK',
    purchaseDate: new Date('2023-02-15'),
    purchasePrice: 150.25,
    quantity: 10,
    currentValue: 1750.30,
    tbszAccountId: 'tbsz-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    tbszAccount: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    asset: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TbszService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TbszService>(TbszService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountDto: CreateTbszAccountDto = {
      name: 'TBSZ 2024',
      openingDate: new Date('2024-01-01'),
      maturityDate: new Date('2029-01-01'),
      status: 'ACTIVE',
      initialDepositAmount: 1500000,
      userId: 'user-123',
    };

    it('should create TBSZ account successfully', async () => {
      mockPrismaService.tbszAccount.create.mockResolvedValue({
        ...createAccountDto,
        id: 'tbsz-456',
        createdAt: new Date(),
        updatedAt: new Date(),
        assets: [],
      });

      const result = await service.createAccount(createAccountDto);

      expect(mockPrismaService.tbszAccount.create).toHaveBeenCalledWith({
        data: {
          name: 'TBSZ 2024',
          openingDate: createAccountDto.openingDate,
          maturityDate: createAccountDto.maturityDate,
          status: 'ACTIVE',
          initialDepositAmount: 1500000,
          userId: 'user-123',
        },
        include: {
          assets: true,
        },
      });
      expect(result.name).toBe('TBSZ 2024');
      expect(result.userId).toBe('user-123');
    });
  });

  describe('getAccounts', () => {
    it('should return TBSZ accounts for user', async () => {
      const mockAccounts = [mockTbszAccount];
      mockPrismaService.tbszAccount.findMany.mockResolvedValue(mockAccounts);

      const result = await service.getAccounts('user-123');

      expect(mockPrismaService.tbszAccount.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          assets: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array when no accounts found', async () => {
      mockPrismaService.tbszAccount.findMany.mockResolvedValue([]);

      const result = await service.getAccounts('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getAccountById', () => {
    it('should return TBSZ account by ID', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(mockTbszAccount);

      const result = await service.getAccountById('user-123', 'tbsz-123');

      expect(mockPrismaService.tbszAccount.findFirst).toHaveBeenCalledWith({
        where: { id: 'tbsz-123', userId: 'user-123' },
        include: {
          assets: true,
        },
      });
      expect(result).toEqual(mockTbszAccount);
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.getAccountById('user-123', 'nonexistent-tbsz')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAccount', () => {
    const updateData = {
      name: 'Updated TBSZ',
      status: 'MATURED',
    };

    it('should update TBSZ account successfully', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(mockTbszAccount);
      const updatedAccount = { ...mockTbszAccount, ...updateData };
      mockPrismaService.tbszAccount.update.mockResolvedValue(updatedAccount);

      const result = await service.updateAccount('user-123', 'tbsz-123', updateData);

      expect(mockPrismaService.tbszAccount.findFirst).toHaveBeenCalledWith({
        where: { id: 'tbsz-123', userId: 'user-123' },
      });
      expect(mockPrismaService.tbszAccount.update).toHaveBeenCalledWith({
        where: { id: 'tbsz-123' },
        data: updateData,
        include: {
          assets: true,
        },
      });
      expect(result.name).toBe('Updated TBSZ');
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.updateAccount('user-123', 'nonexistent-tbsz', updateData)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete TBSZ account successfully', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(mockTbszAccount);
      mockPrismaService.tbszAccount.delete.mockResolvedValue(mockTbszAccount);

      await service.deleteAccount('user-123', 'tbsz-123');

      expect(mockPrismaService.tbszAccount.findFirst).toHaveBeenCalledWith({
        where: { id: 'tbsz-123', userId: 'user-123' },
      });
      expect(mockPrismaService.tbszAccount.delete).toHaveBeenCalledWith({
        where: { id: 'tbsz-123' },
      });
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteAccount('user-123', 'nonexistent-tbsz')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateMaturityProgress', () => {
    it('should calculate maturity progress correctly', () => {
      const account = {
        openingDate: new Date('2023-01-01'),
        maturityDate: new Date('2028-01-01'),
      };

      const progress = service.calculateMaturityProgress(account);

      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should return 100 for matured account', () => {
      const account = {
        openingDate: new Date('2019-01-01'),
        maturityDate: new Date('2024-01-01'),
      };

      const progress = service.calculateMaturityProgress(account);

      expect(progress).toBe(100);
    });
  });

  describe('calculateRemainingDays', () => {
    it('should calculate remaining days correctly', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const account = {
        maturityDate: futureDate,
      };

      const remainingDays = service.calculateRemainingDays(account);

      expect(remainingDays).toBeGreaterThan(300);
      expect(remainingDays).toBeLessThan(400);
    });

    it('should return 0 for matured account', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      
      const account = {
        maturityDate: pastDate,
      };

      const remainingDays = service.calculateRemainingDays(account);

      expect(remainingDays).toBe(0);
    });
  });

  describe('addAsset', () => {
    const createAssetDto = {
      name: 'Apple Inc.',
      symbol: 'AAPL',
      type: 'STOCK',
      purchaseDate: new Date('2023-02-15'),
      purchasePrice: 150.25,
      quantity: 10,
      currentValue: 1750.30,
    };

    it('should add asset to TBSZ account successfully', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(mockTbszAccount);
      mockPrismaService.asset.create.mockResolvedValue({
        ...createAssetDto,
        id: 'asset-456',
        tbszAccountId: 'tbsz-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.addAsset('user-123', 'tbsz-123', createAssetDto);

      expect(mockPrismaService.tbszAccount.findFirst).toHaveBeenCalledWith({
        where: { id: 'tbsz-123', userId: 'user-123' },
      });
      expect(mockPrismaService.asset.create).toHaveBeenCalledWith({
        data: {
          ...createAssetDto,
          tbszAccountId: 'tbsz-123',
        },
      });
    });

    it('should throw NotFoundException when TBSZ account not found', async () => {
      mockPrismaService.tbszAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.addAsset('user-123', 'nonexistent-tbsz', createAssetDto)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
