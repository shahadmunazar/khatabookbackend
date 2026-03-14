import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
export class LoginDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  mobile_no?: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
