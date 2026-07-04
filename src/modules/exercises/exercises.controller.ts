import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/entities/jwt-user.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ExerciseQueryDto } from './dto/exercise-query.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExercisesService } from './services/exercises.service';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'exercises', version: '1' })
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Roles(Role.ADMIN, Role.COACH)
  @Post()
  create(@Body() dto: CreateExerciseDto, @CurrentUser() user: JwtUser) {
    return this.exercisesService.create(dto, user.sub);
  }

  @Get('muscle-groups')
  getMuscleGroups() {
    return this.exercisesService.getMuscleGroups();
  }

  @Get()
  findMany(@Query() query: ExerciseQueryDto) {
    return this.exercisesService.findMany(query);
  }

  @Get('popular')
  findPopular(@Query('limit', new ParseIntPipe({ optional: true })) limit = 4) {
    return this.exercisesService.findPopular(limit);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.exercisesService.findById(id);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exercisesService.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exercisesService.remove(id);
  }

  @Roles(Role.STUDENT)
  @Post(':id/bookmark')
  bookmark(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.exercisesService.bookmark(user.sub, id);
  }

  @Roles(Role.STUDENT)
  @Delete(':id/bookmark')
  unbookmark(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.exercisesService.unbookmark(user.sub, id);
  }
}
