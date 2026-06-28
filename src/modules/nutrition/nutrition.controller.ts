import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/entities/jwt-user.entity';
import { CreateNutritionPlanDto } from './dto/create-nutrition-plan.dto';
import { UpdateMealReminderDto } from './dto/update-meal-reminder.dto';
import { NutritionService } from './services/nutrition.service';

@ApiTags('Nutrition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'nutrition', version: '1' })
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Roles(Role.ADMIN, Role.COACH)
  @Post('plans')
  create(@Body() dto: CreateNutritionPlanDto, @CurrentUser() user: JwtUser) {
    return this.nutritionService.createOrReplace(dto, user);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Get('plans/student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.nutritionService.findByStudent(studentId);
  }

  @Roles(Role.STUDENT)
  @Get('plans/my')
  findMy(@CurrentUser('sub') studentId: string) {
    return this.nutritionService.findMy(studentId);
  }

  @Roles(Role.STUDENT)
  @Patch('plans/:id/meals/:mealId/reminder')
  updateMealReminder(
    @Param('id') planId: string,
    @Param('mealId') mealId: string,
    @Body() dto: UpdateMealReminderDto,
    @CurrentUser('sub') studentId: string,
  ) {
    return this.nutritionService.updateMealReminder(planId, mealId, dto, studentId);
  }
}
