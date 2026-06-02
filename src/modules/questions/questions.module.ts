import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsRepository } from './repositories/questions.repository';
import { QuestionsService } from './services/questions.service';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository],
})
export class QuestionsModule {}
