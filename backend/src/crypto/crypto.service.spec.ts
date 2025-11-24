import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
  } as unknown as PrismaService;

  const mockTwelveDataService = {
    getPrices: jest.fn(),
    getPrice: jest.fn(),
  } as unknown as TwelveDataService;

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
      (prismaService.crypto.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(result).toEqual([]);
      expect(prismaService.crypto.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { name: 'asc' },
      });
    });

    it('should return cryptos with updated prices', async () => {
      (prismaService.crypto.findMany as jest.Mock).mockResolvedValue([
        mockCrypto,
      ]);
      (twelveDataService.getPrices as jest.Mock).mockResolvedValue(
        new Map([['BTC/USD', 35000]]),
      );
      (prismaService.crypto.update as jest.Mock).mockResolvedValue(mockCrypto);

      const result = await service.findAll('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].currentPrice).toBe(35000);
      expect(twelveDataService.getPrices).toHaveBeenCalledWith(['BTC/USD']);
      expect(prismaService.crypto.update).toHaveBeenCalled();
    });

    it('should handle price fetch errors gracefully', async () => {
      (prismaService.crypto.findMany as jest.Mock).mockResolvedValue([
        mockCrypto,
      ]);
      (twelveDataService.getPrices as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      const result = await service.findAll('user-123');

      expect(result).toEqual([mockCrypto]);
    });

    it('should calculate total change correctly', async () => {
      const cryptoWithLoss = {
        ...mockCrypto,
        priceAtPurchase: 40000,
      };
      (prismaService.crypto.findMany as jest.Mock).mockResolvedValue([
        cryptoWithLoss,
      ]);
      (twelveDataService.getPrices as jest.Mock).mockResolvedValue(
        new Map([['BTC/USD', 35000]]),
      );
      (prismaService.crypto.update as jest.Mock).mockResolvedValue(
        cryptoWithLoss,
      );

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
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (twelveDataService.getPrice as jest.Mock).mockResolvedValue(2500);
      (prismaService.crypto.create as jest.Mock).mockResolvedValue({
        ...createCryptoDto,
        id: 'crypto-456',
        currentPrice: 2500,
        currentValue: 5000,
        totalChange: 25,
      });

      const result = await service.create(createCryptoDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(twelveDataService.getPrice).toHaveBeenCalledWith('ETH/USD');
      expect(prismaService.crypto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createCryptoDto,
          currentPrice: 2500,
          currentValue: 5000,
          totalChange: 25,
        }),
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createCryptoDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should fallback to purchase price when API fails', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (twelveDataService.getPrice as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );
      (prismaService.crypto.create as jest.Mock).mockResolvedValue({
        ...createCryptoDto,
        id: 'crypto-456',
        currentPrice: 2000,
        currentValue: 4000,
        totalChange: 0,
      });

      const result = await service.create(createCryptoDto);

      expect(prismaService.crypto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createCryptoDto,
          currentPrice: 2000,
          currentValue: 4000,
          totalChange: 0,
        }),
      });
      expect(result).toBeDefined();
    });

    it('should handle invalid price data gracefully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (twelveDataService.getPrice as jest.Mock).mockResolvedValue(NaN);
      (prismaService.crypto.create as jest.Mock).mockResolvedValue({
        ...createCryptoDto,
        id: 'crypto-456',
        currentPrice: 2000,
        currentValue: 4000,
        totalChange: 0,
      });

      const result = await service.create(createCryptoDto);

      expect(prismaService.crypto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createCryptoDto,
          currentPrice: 2000,
          currentValue: 4000,
          totalChange: 0,
        }),
      });
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete crypto successfully', async () => {
      (prismaService.crypto.findFirst as jest.Mock).mockResolvedValue(
        mockCrypto,
      );
      (prismaService.crypto.delete as jest.Mock).mockResolvedValue(mockCrypto);

      await service.delete('user-123', 'crypto-123');

      expect(prismaService.crypto.findFirst).toHaveBeenCalledWith({
        where: { id: 'crypto-123', userId: 'user-123' },
      });
      expect(prismaService.crypto.delete).toHaveBeenCalledWith({
        where: { id: 'crypto-123' },
      });
    });

    it('should handle crypto not found gracefully', async () => {
      (prismaService.crypto.findFirst as jest.Mock).mockResolvedValue(null);

      await service.delete('user-123', 'nonexistent-crypto');

      expect(prismaService.crypto.findFirst).toHaveBeenCalledWith({
        where: { id: 'nonexistent-crypto', userId: 'user-123' },
      });
      expect(prismaService.crypto.delete).not.toHaveBeenCalled();
    });
  });
});
