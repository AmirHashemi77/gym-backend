import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsRepository } from './repositories/programs.repository';
import { ProgramsService } from './services/programs.service';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramsRepository],
})
export class ProgramsModule {}
