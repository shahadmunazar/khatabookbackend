import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginOtpDto } from './dto/login-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Op } from 'sequelize';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Role } from '../models/role.model';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;
  private readonly baseUrl: string;

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Role)
    private roleModel: typeof Role,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<number>('MAIL_PORT') === 465, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USERNAME'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  private async sendMail(to: string, subject: string, text: string, html?: string) {
    const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME');
    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`[MAIL SENT] To: ${to}, Subject: ${subject}`);
    } catch (e) {
      console.error('Mail send failed', e);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, phone, mobile_no, password } = loginDto;

    const identifier = email || phone || mobile_no;

    if (!identifier) {
      throw new BadRequestException('Please provide email or phone number');
    }

    // Support login with either email or phone
    const user = await this.userModel.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    if (user.status === 'disabled') {
      throw new UnauthorizedException('Your account has been disabled. Please contact support.');
    }

    return this.generateTokenResponse(user);
  }

  async generateTokenResponse(user: User) {
    const payload = { sub: user.id, email: user.email, type: user.userType };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        user_type: user.userType,
        is_verified: user.isVerified,
      },
    };
  }

  async createDriver(parentCompany: User, driverDto: CreateDriverDto) {
    if (parentCompany.userType !== 'company') {
      throw new ForbiddenException('Only companies can create drivers');
    }

    const registrationData: RegisterDto = {
      ...driverDto,
      user_type: 'individual',
      company_id: parentCompany.id,
    };

    return this.register(registrationData, true);
  }

  async register(registerDto: RegisterDto, autoVerify = false) {
    const { name, email, phone, password, user_type, company_id, profile_image } = registerDto;

    const existingUser = await this.userModel.findOne({ where: { email } });
    if (existingUser) throw new ConflictException('User with this email already exists');

    const existingPhone = await this.userModel.findOne({ where: { phone } });
    if (existingPhone) throw new ConflictException('User with this phone number already exists');

    if (company_id) {
      const company = await this.userModel.findByPk(company_id);
      if (!company || company.userType !== 'company') {
        throw new ConflictException('Invalid company mapping');
      }
    }

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    const verificationToken = this.generateToken();

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userModel.create({
        name,
        email,
        phone,
        password: hashedPassword,
        userType: user_type,
        companyId: company_id,
        profileImage: profile_image || null,
        otp: autoVerify ? null : otp,
        otpExpiry: autoVerify ? null : otpExpiry,
        verificationToken: autoVerify ? null : verificationToken,
        isVerified: autoVerify,
      });

      // Assign Role
      const role = await this.roleModel.findOne({ where: { name: user_type } });
      if (role) {
        await user.$set('roles', [role.id]);
      }

      if (!autoVerify) {
        const verifyLink = `${this.baseUrl}/auth/verify?token=${verificationToken}`;
        const emailHtml = `
          <p>Hello ${name},</p>
          <p>Please verify your email using OTP: <b>${otp}</b></p>
          <p>Or click this link: <a href="${verifyLink}">${verifyLink}</a></p>
        `;
        await this.sendMail(email, 'Verify your email', `Your OTP is ${otp}`, emailHtml);
      }

      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.otp;
      delete userResponse.verificationToken;

      return {
        message: 'Registration successful. Please check your email for verification link or OTP.',
        user: userResponse,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error registering user');
    }
  }

  async verifyEmail(verifyDto: VerifyEmailDto) {
    const { email, otp } = verifyDto;
    const user = await this.userModel.findOne({ where: { email, otp } });

    if (!user || !user.otpExpiry || user.otpExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.verificationToken = null;
    await user.save();

    return { message: 'Email verified successfully. You can now login.' };
  }

  async verifyByToken(token: string) {
    const user = await this.userModel.findOne({ where: { verificationToken: token } });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.verificationToken = null;
    await user.save();

    return { message: 'Email verified successfully. You can now login.' };
  }

  async sendLoginOtp(email: string) {
    const user = await this.userModel.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const otp = this.generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.sendMail(email, 'Login OTP', `Your login OTP is: ${otp}`);
    return { message: 'Login OTP sent to your email' };
  }

  async loginWithOtp(loginOtpDto: LoginOtpDto) {
    const { email, otp } = loginOtpDto;
    const user = await this.userModel.findOne({ where: { email, otp } });

    if (!user || !user.otpExpiry || user.otpExpiry < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    user.otp = null;
    user.otpExpiry = null;
    if (!user.isVerified) user.isVerified = true;
    await user.save();
    return this.generateTokenResponse(user);
  }

  async updateProfileImage(user: User, fileName: string) {
    user.profileImage = fileName;
    await user.save();
    return {
      message: 'Profile image updated successfully',
      profile_image: fileName,
      url: `${this.baseUrl}/uploads/${fileName}`
    };
  }

  async updateProfile(user: User, updateDto: UpdateProfileDto) {
    const { name, phone } = updateDto;

    if (phone && phone !== user.phone) {
      const existing = await this.userModel.findOne({ where: { phone } });
      if (existing) throw new ConflictException('Phone number already in use');
      user.phone = phone;
    }

    if (name) user.name = name;

    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.otp;
    delete userResponse.verificationToken;

    return {
      message: 'Profile updated successfully',
      user: userResponse
    };
  }

  async adminUpdateUser(id: number, updateDto: UpdateUserAdminDto) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    if (updateDto.phone) {
      const existing = await this.userModel.findOne({ where: { phone: updateDto.phone, id: { [Op.ne]: id } } });
      if (existing) throw new ConflictException('Phone number already in use');
    }

    await user.update(updateDto);
    return { message: 'User updated successfully', user };
  }

  async updateDriver(parentCompany: User, driverId: number, driverDto: CreateDriverDto) {
    if (parentCompany.userType !== 'company') {
      throw new ForbiddenException('Only companies can update drivers');
    }

    const driver = await this.userModel.findByPk(driverId);
    if (!driver || driver.companyId !== parentCompany.id) {
      throw new NotFoundException('Driver not found or does not belong to your company');
    }

    const { name, phone, password, profile_image } = driverDto;

    if (phone && phone !== driver.phone) {
      const existing = await this.userModel.findOne({ where: { phone, id: { [Op.ne]: driverId } } });
      if (existing) throw new ConflictException('Phone number already in use');
      driver.phone = phone;
    }

    if (name) driver.name = name;
    if (profile_image) driver.profileImage = profile_image;
    if (password) {
      driver.password = await bcrypt.hash(password, 10);
    }

    await driver.save();
    return { message: 'Driver updated successfully', driver };
  }

  async adminDeleteUser(id: number) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  async adminToggleStatus(id: number, status: 'active' | 'disabled') {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('User not found');

    user.status = status;
    await user.save();
    return { message: `User ${status} successfully`, status: user.status };
  }
}
