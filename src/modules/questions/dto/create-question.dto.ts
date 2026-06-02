import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  exerciseId?: string;

  @ApiProperty({ example: 'در اجرای اسکوات زانوهایم درد می‌گیرد، چه کنم؟' })
  @IsString()
  question!: string;
}
