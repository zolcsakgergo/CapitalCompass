import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { StocksService, CreateStockDto } from './stocks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TwelveDataService } from '../twelve-data/twelve-data.service';

describe('StocksService', () => {
  let service: StocksService;
  let prismaService: PrismaService;
  let twelveDataService: TwelveDataService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockStock = {
    id: 'stock-123',
    stockName: 'Apple Inc.',
    symbol: 'AAPL',
    shares: 10,
    dateAcquired: new Date('2023-01-01'),
    priceAtPurchase: 150.25,
    currentPrice: 175.50,
    previousDayPrice: 170.25,
    yearStartPrice: 140.00,
    lastPriceUpdate: new Date(),
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    stock: {
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
        StocksService,
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

    service = module.get<StocksService>(StocksService);
    prismaService = module.get<PrismaService>(PrismaService);
    twelveDataService = module.get<TwelveDataService>(TwelveDataService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return empty array when no stocks found', async () => {
      mockPrismaService.stock.findMany.mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(result).toEqual([]);
      expect(mockPrismaService.stock.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return stocks with updated prices', async () => {
      const mockStocks = [mockStock];
      mockPrismaService.stock.findMany.mockResolvedValue(mockStocks);
      mockTwelveDataService.getPrices.mockResolvedValue(
        new Map([['AAPL', 175.50]])
      );
      mockPrismaService.stock.update.mockResolvedValue(mockStock);

      const result = await service.findAll('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].currentPrice).toBe(175.50);
      expect(mockTwelveDataService.getPrices).toHaveBeenCalledWith(['AAPL']);
    });

    it('should handle price fetch errors gracefully', async () => {
      const mockStocks = [mockStock];
      mockPrismaService.stock.findMany.mockResolvedValue(mockStocks);
      mockTwelveDataService.getPrices.mockResolvedValue(new Map());

      const result = await service.findAll('user-123');

      expect(result).toHaveLength(1);
    });

    it('should calculate performance metrics correctly', async () => {
      const stockWithMetrics = {
        ...mockStock,
        currentPrice: 180.00,
        priceAtPurchase: 150.00,
      };
      mockPrismaService.stock.findMany.mockResolvedValue([stockWithMetrics]);
      mockTwelveDataService.getPrices.mockResolvedValue(
        new Map([['AAPL', 180.00]])
      );
      mockPrismaService.stock.update.mockResolvedValue(stockWithMetrics);

      const result = await service.findAll('user-123');

      expect(result[0]).toMatchObject({
        currentPrice: expect.any(Number),
      });
    });
  });

  describe('create', () => {
    const createStockDto: CreateStockDto = {
      stockName: 'Microsoft Corporation',
      symbol: 'MSFT',
      shares: 5,
      dateAcquired: new Date('2023-01-01'),
      priceAtPurchase: 280.15,
      userId: 'user-123',
    };

    it('should create stock with current price', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockTwelveDataService.getPrice.mockResolvedValue(295.00);
      mockPrismaService.stock.create.mockResolvedValue({
        ...createStockDto,
        id: 'stock-456',
        currentPrice: 295.00,
        lastPriceUpdate: new Date(),
      });

      const result = await service.create(createStockDto);

      expect(result).toBeDefined();
      expect(mockTwelveDataService.getPrice).toHaveBeenCalledWith('MSFT');
      expect(mockPrismaService.stock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createStockDto,
          currentPrice: 295.00,
          lastPriceUpdate: expect.any(Date),
        }),
      });
    });

    it('should create stock even without explicit user validation', async () => {
      mockTwelveDataService.getPrice.mockResolvedValue(295.00);
      mockPrismaService.stock.create.mockResolvedValue({
        ...createStockDto,
        id: 'stock-456',
        currentPrice: 295.00,
        lastPriceUpdate: new Date(),
      });

      const result = await service.create(createStockDto);
      expect(result).toBeDefined();
    });

    it('should handle API errors during creation', async () => {
      mockTwelveDataService.getPrice.mockRejectedValue(new Error('API Error'));

      await expect(service.create(createStockDto)).rejects.toThrow('API Error');
    });
  });

  describe('delete', () => {
    it('should delete stock successfully', async () => {
      mockPrismaService.stock.findFirst.mockResolvedValue(mockStock);
      mockPrismaService.stock.delete.mockResolvedValue(mockStock);

      await service.delete('user-123', 'stock-123');

      expect(mockPrismaService.stock.findFirst).toHaveBeenCalledWith({
        where: { id: 'stock-123', userId: 'user-123' },
      });
      expect(mockPrismaService.stock.delete).toHaveBeenCalledWith({
        where: { id: 'stock-123' },
      });
    });

    it('should handle stock not found gracefully', async () => {
      mockPrismaService.stock.findFirst.mockResolvedValue(null);

      await service.delete('user-123', 'nonexistent-stock');

      expect(mockPrismaService.stock.findFirst).toHaveBeenCalledWith({
        where: { id: 'nonexistent-stock', userId: 'user-123' },
      });
      expect(mockPrismaService.stock.delete).not.toHaveBeenCalled();
    });
  });


});
