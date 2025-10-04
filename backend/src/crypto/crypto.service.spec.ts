import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwelveDataService } from '../twelve-data/twelve-data.service';

describe('CryptoService', () => {
  let service: CryptoService;
  let prismaService: PrismaService;
  let twelveDataService: TwelveDataService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockCrypto = {
    id: 'crypto-123',
    name: 'Bitcoin',
    symbol: 'BTC',
    amount: 1.5,
    priceAtPurchase: 30000,
    dateAcquired: new Date('2023-01-01'),
    type: 'crypto',
    currentPrice: 35000,
    currentValue: 52500,
    totalChange: 16.67,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    crypto: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockTwelveDataService = {
    getPrices: jest.fn(),
    getPrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TwelveDataService,
          useValue: mockTwelveDataService,
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
    prismaService = module.get<PrismaService>(PrismaService);
    twelveDataService = module.get<TwelveDataService>(TwelveDataService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return empty array when no cryptos found', async () => {
      mockPrismaService.crypto.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(result).toEqual([]);
      expect(mockPrismaService.crypto.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { name: 'asc' },
      });
    });

    it('should return cryptos with updated prices', async () => {
      const mockCryptos = [mockCrypto];
      mockPrismaService.crypto.findMany.mockResolvedValue(mockCryptos);
      mockTwelveDataService.getPrices.mockResolvedValue(
        new Map([['BTC/USD', 35000]])
      );
      mockPrismaService.crypto.update.mockResolvedValue(mockCrypto);

      const result = await service.findAll('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].currentPrice).toBe(35000);
      expect(mockTwelveDataService.getPrices).toHaveBeenCalledWith(['BTC/USD']);
      expect(mockPrismaService.crypto.update).toHaveBeenCalled();
    });

    it('should handle price fetch errors gracefully', async () => {
      const mockCryptos = [mockCrypto];
      mockPrismaService.crypto.findMany.mockResolvedValue(mockCryptos);
      mockTwelveDataService.getPrices.mockRejectedValue(new Error('API Error'));

      const result = await service.findAll('user-123');

      expect(result).toEqual(mockCryptos);
    });

    it('should calculate total change correctly', async () => {
      const cryptoWithLoss = {
        ...mockCrypto,
        priceAtPurchase: 40000,
      };
      mockPrismaService.crypto.findMany.mockResolvedValue([cryptoWithLoss]);
      mockTwelveDataService.getPrices.mockResolvedValue(
        new Map([['BTC/USD', 35000]])
      );
      mockPrismaService.crypto.update.mockResolvedValue(cryptoWithLoss);

      const result = await service.findAll('user-123');

      expect(result[0].totalChange).toBe(-12.5); 
    });
  });

  describe('create', () => {
    const createCryptoDto = {
      name: 'Ethereum',
      symbol: 'ETH',
      amount: 2.0,
      priceAtPurchase: 2000,
      dateAcquired: new Date('2023-01-01'),
      userId: 'user-123',
    };

    it('should create crypto with current price', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockTwelveDataService.getPrice.mockResolvedValue(2500);
      mockPrismaService.crypto.create.mockResolvedValue({
        ...createCryptoDto,
        id: 'crypto-456',
        currentPrice: 2500,
        currentValue: 5000,
        totalChange: 25,
      });

      const result = await service.create(createCryptoDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(mockTwelveDataService.getPrice).toHaveBeenCalledWith('ETH/USD');
      expect(mockPrismaService.crypto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createCryptoDto,
          currentPrice: 2500,
          currentValue: 5000,
          totalChange: 25,
        }),
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createCryptoDto)).rejects.toThrow(
        NotFoundException
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should fallback to purchase price when API fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockTwelveDataService.getPrice.mockRejectedValue(new Error('API Error'));
      mockPrismaService.crypto.create.mockResolvedValue({
        ...createCryptoDto,
        id: 'crypto-456',
        currentPrice: 2000,
        currentValue: 4000,
        totalChange: 0,
      });

      const result = await service.create(createCryptoDto);

      expect(mockPrismaService.crypto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createCryptoDto,
          currentPrice: 2000,
          currentValue: 4000,
          totalChange: 0,
        }),
      });
    });

    it('should handle invalid price data gracefully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockTwelveDataService.getPrice.mockResolvedValue(NaN);
      mockPrismaService.crypto.create.mockResolvedValue({
        ...createCryptoDto,
        id: 'crypto-456',
        currentPrice: 2000,
        currentValue: 4000,
        totalChange: 0,
      });

      const result = await service.create(createCryptoDto);

      expect(mockPrismaService.crypto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createCryptoDto,
          currentPrice: 2000,
          currentValue: 4000,
          totalChange: 0,
        }),
      });
    });
  });

  describe('delete', () => {
    it('should delete crypto successfully', async () => {
      mockPrismaService.crypto.findFirst.mockResolvedValue(mockCrypto);
      mockPrismaService.crypto.delete.mockResolvedValue(mockCrypto);

      await service.delete('user-123', 'crypto-123');

      expect(mockPrismaService.crypto.findFirst).toHaveBeenCalledWith({
        where: { id: 'crypto-123', userId: 'user-123' },
      });
      expect(mockPrismaService.crypto.delete).toHaveBeenCalledWith({
        where: { id: 'crypto-123' },
      });
    });

    it('should handle crypto not found gracefully', async () => {
      mockPrismaService.crypto.findFirst.mockResolvedValue(null);

      await service.delete('user-123', 'nonexistent-crypto');

      expect(mockPrismaService.crypto.findFirst).toHaveBeenCalledWith({
        where: { id: 'nonexistent-crypto', userId: 'user-123' },
      });
      expect(mockPrismaService.crypto.delete).not.toHaveBeenCalled();
    });
  });
});
