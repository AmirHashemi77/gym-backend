import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class RegisterStudentDto {
  @ApiProperty({ example: 'علی رضایی' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '09123334455' })
  @IsPhoneNumber('IR')
  phone!: string;

  @ApiPropertyOptional({ example: 'student@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  height?: number;

  @ApiPropertyOptional({ example: 'افزایش حجم عضلانی' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
