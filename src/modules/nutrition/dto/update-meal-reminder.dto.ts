import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class UpdateMealReminderDto {
  @ApiPropertyOptional({ example: '08:00', nullable: true, description: 'HH:MM یا null برای حذف یادآور' })
  @IsOptional()
  @ValidateIf((o) => o.reminderTime !== null)
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'فرمت زمان باید HH:MM باشد' })
  reminderTime?: string | null;
}
