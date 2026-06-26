import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsEmail, IsEnum, IsInt, IsOptional, IsPhoneNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'رضا احمدی' })
  @IsString()
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
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(20)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Min(50)
  height?: number;

  @ApiPropertyOptional({ example: 'افزایش حجم عضلانی' })
  @IsOptional()
  @IsString()
  goal?: string;
}
