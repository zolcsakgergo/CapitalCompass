import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let usersService: UsersService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUsersService = {
    getUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'password123',
        '$2b$10$hashedpassword'
      );
    });

    it('should return null when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        '$2b$10$hashedpassword'
      );
    });
  });

  describe('login', () => {
    const validUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should return access token and user data for valid user', async () => {
      const mockToken = 'jwt-token-123';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(validUser);

      expect(result).toEqual({
        access_token: mockToken,
        user: validUser,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'user-123',
      });
    });

    it('should throw UnauthorizedException when user is null', async () => {
      await expect(service.login(null)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is undefined', async () => {
      await expect(service.login(undefined)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('$2b$10$hashedpassword' as never);
      const newUser = {
        ...registerData,
        id: 'user-456',
        passwordHash: '$2b$10$hashedpassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await service.register(
        registerData.email,
        registerData.password,
        registerData.firstName,
        registerData.lastName
      );

      expect(result).toEqual({
        id: 'user-456',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        isActive: true,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        password: 'password123',
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          passwordHash: '$2b$10$hashedpassword',
          firstName: 'New',
          lastName: 'User',
        },
      });
    });

    it('should throw UnauthorizedException when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register(
          registerData.email,
          registerData.password,
          registerData.firstName,
          registerData.lastName
        )
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      mockUsersService.getUserProfile.mockResolvedValue(mockProfile);

      const result = await service.getProfile('user-123');

      expect(result).toEqual(mockProfile);
      expect(mockUsersService.getUserProfile).toHaveBeenCalledWith('user-123');
    });
  });
});
