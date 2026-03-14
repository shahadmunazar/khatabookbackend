import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginOtpDto } from './dto/login-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '../models/user.model';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify')
  async verifyByToken(@Query('token') token: string) {
    return this.authService.verifyByToken(token);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyDto);
  }

  @Post('send-login-otp')
  async sendLoginOtp(@Body('email') email: string) {
    return this.authService.sendLoginOtp(email);
  }

  @Post('login-otp')
  async loginWithOtp(@Body() loginOtpDto: LoginOtpDto) {
    return this.authService.loginWithOtp(loginOtpDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-driver')
  async createDriver(
    @GetUser() user: User,
    @Body() driverDto: RegisterDto,
  ) {
    return this.authService.createDriver(user, driverDto);
  }
}
