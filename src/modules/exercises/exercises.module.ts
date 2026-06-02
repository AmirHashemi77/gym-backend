import { Module } from '@nestjs/common';
import { ExercisesController } from './exercises.controller';
import { ExercisesRepository } from './repositories/exercises.repository';
import { ExercisesService } from './services/exercises.service';

@Module({
  controllers: [ExercisesController],
  providers: [ExercisesService, ExercisesRepository],
  exports: [ExercisesService],
})
export class ExercisesModule {}
