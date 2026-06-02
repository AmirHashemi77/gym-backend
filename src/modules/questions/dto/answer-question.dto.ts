import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnswerQuestionDto {
  @ApiProperty({ example: 'دامنه حرکت را کمتر کن و ویدیوی اجرا را برای بررسی بفرست.' })
  @IsString()
  answer!: string;
}
