import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/entities/jwt-user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './services/questions.service';

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'questions', version: '1' })
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Roles(Role.STUDENT)
  @Post()
  create(@Body() dto: CreateQuestionDto, @CurrentUser() user: JwtUser) {
    return this.questionsService.create(dto, user);
  }

  @Get()
  findMany(@Query() query: PaginationQueryDto, @CurrentUser() user: JwtUser) {
    return this.questionsService.findMany(query, user);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Patch(':id/answer')
  answer(@Param('id') id: string, @Body() dto: AnswerQuestionDto, @CurrentUser() user: JwtUser) {
    return this.questionsService.answer(id, dto.answer, user);
  }
}
