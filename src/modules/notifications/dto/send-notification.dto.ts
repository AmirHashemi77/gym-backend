import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ example: 'برنامه جدید' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'برنامه تمرینی جدید برای شما ثبت شد.' })
  @IsString()
  body!: string;
}
