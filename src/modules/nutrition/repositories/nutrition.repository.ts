import { Injectable } from '@nestjs/common';
import { MealType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

const planInclude = {
  meals: { orderBy: { order: 'asc' as const } },
};

export interface MealCreateInput {
  type: MealType;
  label: string;
  description: string;
  order: number;
}

@Injectable()
export class NutritionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByStudent(studentId: string) {
    return this.prisma.nutritionPlan.findFirst({
      where: { studentId },
      include: planInclude,
    });
  }

  async replace(studentId: string, coachId: string, meals: MealCreateInput[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.nutritionPlan.deleteMany({ where: { studentId } });
      return tx.nutritionPlan.create({
        data: { studentId, coachId, meals: { create: meals } },
        include: planInclude,
      });
    });
  }

  findMealWithPlan(mealId: string) {
    return this.prisma.nutritionMeal.findUnique({
      where: { id: mealId },
      include: { plan: { select: { id: true, studentId: true } } },
    });
  }

  updateMealReminder(mealId: string, reminderTime: string | null) {
    return this.prisma.nutritionMeal.update({
      where: { id: mealId },
      data: { reminderTime },
    });
  }
}
