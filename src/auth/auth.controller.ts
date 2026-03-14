import { Controller, Post, Body, UseGuards, Get, Query, UseInterceptors, UploadedFile, Param, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginOtpDto } from './dto/login-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
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
  @Get('profile')
  getProfile(@GetUser() user: User) {
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.verificationToken;
    
    // Add full URL for profile image if it exists
    if (userResponse.profile_image) {
      userResponse.profile_image_url = `http://localhost:3000/uploads/${userResponse.profile_image}`;
    }
    
    return userResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  async updateProfile(
    @GetUser() user: User,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user, updateDto);
  }

  @Post('logout')
  async logout() {
    return { message: 'Logged out successfully. Please clear your token on the frontend.' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-profile-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadProfileImage(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.updateProfileImage(user, file.filename);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-driver')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async createDriver(
    @GetUser() user: User,
    @Body() driverDto: CreateDriverDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      driverDto.profile_image = file.filename;
    }
    return this.authService.createDriver(user, driverDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-driver/:id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async updateDriver(
    @GetUser() user: User,
    @Param('id') id: number,
    @Body() driverDto: CreateDriverDto, // Reuse or create specialized? Let's use it for simplicity.
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      driverDto.profile_image = file.filename;
    }
    return this.authService.updateDriver(user, id, driverDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/update-user/:id')
  async adminUpdateUser(
    @GetUser() user: User,
    @Param('id') targetId: number,
    @Body() updateDto: UpdateUserAdminDto,
  ) {
    if (user.userType !== 'admin') throw new ForbiddenException('Only admins can perform this action');
    return this.authService.adminUpdateUser(targetId, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/delete-user/:id')
  async adminDeleteUser(
    @GetUser() user: User,
    @Param('id') targetId: number,
  ) {
    if (user.userType !== 'admin') throw new ForbiddenException('Only admins can perform this action');
    return this.authService.adminDeleteUser(targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/toggle-status/:id')
  async adminToggleStatus(
    @GetUser() user: User,
    @Param('id') targetId: number,
    @Body('status') status: 'active' | 'disabled',
  ) {
    if (user.userType !== 'admin') throw new ForbiddenException('Only admins can perform this action');
    return this.authService.adminToggleStatus(targetId, status);
  }
}
