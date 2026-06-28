import { Module } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './services/nutrition.service';
import { NutritionRepository } from './repositories/nutrition.repository';

@Module({
  controllers: [NutritionController],
  providers: [NutritionService, NutritionRepository],
})
export class NutritionModule {}
