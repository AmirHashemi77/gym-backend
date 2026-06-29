import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class FoodsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllCategories() {
    return this.prisma.foodCategory.findMany({
      orderBy: { order: 'asc' },
    });
  }

  findManyByCategory(categorySlug: string) {
    return this.prisma.food.findMany({
      where: { category: { categoryId: categorySlug } },
      orderBy: { name: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.food.findUnique({
      where: { id },
      include: { category: true },
    });
  }
}
