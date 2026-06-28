import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { JwtUser } from '../../../common/entities/jwt-user.entity';
import { CreateNutritionPlanDto } from '../dto/create-nutrition-plan.dto';
import { UpdateMealReminderDto } from '../dto/update-meal-reminder.dto';
import { NutritionRepository } from '../repositories/nutrition.repository';

@Injectable()
export class NutritionService {
  constructor(
    private readonly nutritionRepository: NutritionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createOrReplace(dto: CreateNutritionPlanDto, user: JwtUser) {
    await this.ensureStudent(dto.studentId);
    const coachId = user.role === Role.COACH ? user.sub : await this.resolveCoachId(dto.studentId);
    const plan = await this.nutritionRepository.replace(dto.studentId, coachId, dto.meals);
    return { message: 'برنامه تغذیه ثبت شد', data: plan };
  }

  async findByStudent(studentId: string) {
    await this.ensureStudent(studentId);
    const plan = await this.nutritionRepository.findByStudent(studentId);
    return { data: plan ?? null };
  }

  async findMy(studentId: string) {
    const plan = await this.nutritionRepository.findByStudent(studentId);
    return { data: plan ?? null };
  }

  async updateMealReminder(planId: string, mealId: string, dto: UpdateMealReminderDto, studentId: string) {
    const meal = await this.nutritionRepository.findMealWithPlan(mealId);
    if (!meal || meal.planId !== planId) throw new NotFoundException('وعده غذایی یافت نشد');
    if (meal.plan.studentId !== studentId) throw new ForbiddenException('دسترسی مجاز نیست');
    const updated = await this.nutritionRepository.updateMealReminder(mealId, dto.reminderTime ?? null);
    return { message: 'یادآور تنظیم شد', data: updated };
  }

  private async ensureStudent(studentId: string): Promise<void> {
    const student = await this.prisma.user.findFirst({ where: { id: studentId, role: Role.STUDENT, deletedAt: null } });
    if (!student) throw new NotFoundException('ورزشکار یافت نشد');
  }

  private async resolveCoachId(studentId: string): Promise<string> {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId: studentId } });
    if (!profile?.coachId) throw new NotFoundException('مربی ورزشکار مشخص نیست');
    return profile.coachId;
  }
}
