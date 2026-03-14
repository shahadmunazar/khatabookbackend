import { IsOptional, IsString, IsEnum, IsPhoneNumber } from 'class-validator';

export class UpdateUserAdminDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
  @IsOptional()
  @IsEnum(['active', 'disabled'])
  status?: 'active' | 'disabled';

  @IsOptional()
  @IsEnum(['individual', 'company', 'admin'])
  userType?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
