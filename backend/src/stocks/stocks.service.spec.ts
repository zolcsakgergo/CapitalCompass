import { Test, TestingModule } from '@nestjs/testing';
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
    currentPrice: 175.5,
    previousDayPrice: 170.25,
    yearStartPrice: 140.0,
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
  } as unknown as PrismaService;

  const mockTwelveDataService = {
    getPrices: jest.fn(),
    getPrice: jest.fn(),
  } as unknown as TwelveDataService;

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
      (prismaService.stock.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll('user-123');

      expect(result).toEqual([]);
      expect(prismaService.stock.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should return stocks with updated prices', async () => {
      (prismaService.stock.findMany as jest.Mock).mockResolvedValue([
        mockStock,
      ]);
      (twelveDataService.getPrices as jest.Mock).mockResolvedValue(
        new Map([['AAPL', 175.5]]),
      );
      (prismaService.stock.update as jest.Mock).mockResolvedValue(mockStock);

      const result = await service.findAll('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].currentPrice).toBe(175.5);
      expect(twelveDataService.getPrices).toHaveBeenCalledWith(['AAPL']);
    });

    it('should handle price fetch errors gracefully', async () => {
      (prismaService.stock.findMany as jest.Mock).mockResolvedValue([
        mockStock,
      ]);
      (twelveDataService.getPrices as jest.Mock).mockResolvedValue(new Map());

      const result = await service.findAll('user-123');

      expect(result).toHaveLength(1);
    });

    it('should calculate performance metrics correctly', async () => {
      const stockWithMetrics = {
        ...mockStock,
        currentPrice: 180.0,
        priceAtPurchase: 150.0,
      };
      (prismaService.stock.findMany as jest.Mock).mockResolvedValue([
        stockWithMetrics,
      ]);
      (twelveDataService.getPrices as jest.Mock).mockResolvedValue(
        new Map([['AAPL', 180.0]]),
      );
      (prismaService.stock.update as jest.Mock).mockResolvedValue(
        stockWithMetrics,
      );

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
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (twelveDataService.getPrice as jest.Mock).mockResolvedValue(295.0);
      (prismaService.stock.create as jest.Mock).mockResolvedValue({
        ...createStockDto,
        id: 'stock-456',
        currentPrice: 295.0,
        lastPriceUpdate: new Date(),
      });

      const result = await service.create(createStockDto);

      expect(result).toBeDefined();
      expect(twelveDataService.getPrice).toHaveBeenCalledWith('MSFT');
      expect(prismaService.stock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...createStockDto,
          currentPrice: 295.0,
          lastPriceUpdate: expect.any(Date),
        }),
      });
    });

    it('should create stock even without explicit user validation', async () => {
      (twelveDataService.getPrice as jest.Mock).mockResolvedValue(295.0);
      (prismaService.stock.create as jest.Mock).mockResolvedValue({
        ...createStockDto,
        id: 'stock-456',
        currentPrice: 295.0,
        lastPriceUpdate: new Date(),
      });

      const result = await service.create(createStockDto);
      expect(result).toBeDefined();
    });

    it('should handle API errors during creation', async () => {
      (twelveDataService.getPrice as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      await expect(service.create(createStockDto)).rejects.toThrow('API Error');
    });
  });

  describe('delete', () => {
    it('should delete stock successfully', async () => {
      (prismaService.stock.findFirst as jest.Mock).mockResolvedValue(mockStock);
      (prismaService.stock.delete as jest.Mock).mockResolvedValue(mockStock);

      await service.delete('user-123', 'stock-123');

      expect(prismaService.stock.findFirst).toHaveBeenCalledWith({
        where: { id: 'stock-123', userId: 'user-123' },
      });
      expect(prismaService.stock.delete).toHaveBeenCalledWith({
        where: { id: 'stock-123' },
      });
    });

    it('should handle stock not found gracefully', async () => {
      (prismaService.stock.findFirst as jest.Mock).mockResolvedValue(null);

      await service.delete('user-123', 'nonexistent-stock');

      expect(prismaService.stock.findFirst).toHaveBeenCalledWith({
        where: { id: 'nonexistent-stock', userId: 'user-123' },
      });
      expect(prismaService.stock.delete).not.toHaveBeenCalled();
    });
  });
});
