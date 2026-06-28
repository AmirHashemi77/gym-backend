import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MealType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateMealDto {
  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  type!: MealType;

  @ApiProperty({ example: 'صبحانه' })
  @IsString()
  @MaxLength(100)
  label!: string;

  @ApiProperty({ example: 'نان سبوس‌دار، تخم‌مرغ آب‌پز، پنیر کم‌چرب' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  order!: number;
}

export class CreateNutritionPlanDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty({ type: [CreateMealDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealDto)
  meals!: CreateMealDto[];
}
