import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExerciseBlockType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateExerciseBlockItemDto {
  @ApiProperty()
  @IsUUID()
  exerciseId!: string;

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  sets!: number;

  @ApiProperty({ example: '8-12' })
  @IsString()
  reps!: string;

  @ApiPropertyOptional({ example: '90 ثانیه' })
  @IsOptional()
  @IsString()
  rest?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order!: number;
}

export class CreateExerciseBlockDto {
  @ApiProperty({ enum: ExerciseBlockType })
  @IsEnum(ExerciseBlockType)
  type!: ExerciseBlockType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [CreateExerciseBlockItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseBlockItemDto)
  items!: CreateExerciseBlockItemDto[];
}

export class CreateProgramDayDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  dayNumber!: number;

  @ApiProperty({ type: [CreateExerciseBlockDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateExerciseBlockDto)
  blocks!: CreateExerciseBlockDto[];
}

export class CreateProgramDto {
  @ApiProperty({ example: 'برنامه افزایش حجم ماه اول' })
  @IsString()
  title!: string;

  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty({ type: [CreateProgramDayDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProgramDayDto)
  days!: CreateProgramDayDto[];
}
