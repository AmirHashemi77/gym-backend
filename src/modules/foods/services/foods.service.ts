import { Injectable, NotFoundException } from '@nestjs/common';
import { FoodsRepository } from '../repositories/foods.repository';

@Injectable()
export class FoodsService {
  constructor(private readonly foodsRepository: FoodsRepository) {}

  async findAllCategories() {
    const data = await this.foodsRepository.findAllCategories();
    return { data };
  }

  async findManyByCategory(categorySlug: string) {
    const data = await this.foodsRepository.findManyByCategory(categorySlug);
    return { data };
  }

  async findById(id: string) {
    const food = await this.foodsRepository.findById(id);
    if (!food) throw new NotFoundException('غذا یافت نشد');
    return { data: food };
  }
}
