import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    this.logger.debug(`Attempting to validate user with email: ${email}`);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.debug('User not found');
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    this.logger.debug(`Password validation result: ${isPasswordValid}`);

    if (isPasswordValid) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: pwd, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    this.logger.debug('Login attempt with user:', user);

    if (!user) {
      this.logger.debug('Login failed: No user provided');
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    this.logger.debug('JWT token generated successfully');

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    this.logger.debug(`Registration attempt for email: ${email}`);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.debug('Registration failed: Email already exists');
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
      },
    });

    this.logger.debug('User registered successfully');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return this.login(result);
  }

  async getProfile(userId: string) {
    return this.usersService.getUserProfile(userId);
  }
}
