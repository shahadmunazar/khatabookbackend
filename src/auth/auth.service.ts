import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, type: user.userType };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.userType,
      },
    };
  }

  async createDriver(parentCompany: User, driverDto: RegisterDto) {
    if (parentCompany.userType !== 'company') {
      throw new ForbiddenException('Only companies can create drivers');
    }

    // Drivers are usually individuals
    driverDto.user_type = 'individual';
    driverDto.company_id = parentCompany.id;

    return this.register(driverDto);
  }

  async register(registerDto: RegisterDto) {
    const { name, email, phone, password, user_type, company_id } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingPhone = await this.userModel.findOne({
      where: { phone },
    });

    if (existingPhone) {
      throw new ConflictException('User with this phone number already exists');
    }

    // If company_id is provided, check if the company exists and is indeed a company
    if (company_id) {
      const company = await this.userModel.findByPk(company_id);
      if (!company) {
        throw new ConflictException('The specified company does not exist');
      }
      if (company.userType !== 'company') {
        throw new ConflictException('The specified parent ID must belong to a "company" type user');
      }
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.userModel.create({
        name,
        email,
        phone,
        password: hashedPassword,
        userType: user_type,
        companyId: company_id,
      });

      // Remove password from response
      const userResponse = user.toJSON();
      delete userResponse.password;

      return {
        message: 'User registered successfully',
        user: userResponse,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error registering user');
    }
  }
}
