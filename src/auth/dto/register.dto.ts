import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsString()
  phone: string;
  @IsNotEmpty()
  @MinLength(6)
  password: string;
  @IsEnum(['individual', 'company'], {
    message: 'user_type must be either individual or company',
  })
  user_type: 'individual' | 'company';
  @IsOptional()
  @IsNumber()
  company_id?: number;
}
