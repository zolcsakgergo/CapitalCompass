import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body(new ValidationPipe()) loginDto: LoginDto) {
    this.logger.debug('Login attempt with email:', loginDto.email);

    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      this.logger.debug('Login failed: Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.debug('User validated successfully, generating token');
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body(new ValidationPipe()) registerDto: RegisterDto) {
    this.logger.debug('Registration attempt with email:', registerDto.email);

    try {
      const result = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );
      this.logger.debug('Registration successful');
      return result;
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }
}
