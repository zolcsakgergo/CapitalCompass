import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Logger,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    this.logger.debug(`Login attempt for email: ${loginDto.email}`);
    try {
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );
      if (!user) {
        throw new Error('Invalid credentials');
      }
      const result = await this.authService.login(user);
      this.logger.debug('Login successful');
      return result;
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    this.logger.debug(`Registration attempt for email: ${registerDto.email}`);
    try {
      const result = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
      );
      this.logger.debug('Registration successful');
      return result;
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    this.logger.debug(`Fetching profile for user ID: ${req.user.id}`);
    try {
      const profile = await this.authService.getProfile(req.user.id);
      this.logger.debug('Profile fetch successful');
      return profile;
    } catch (error) {
      this.logger.error('Profile fetch failed:', error);
      throw error;
    }
  }
}
