import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FoodsService } from './services/foods.service';

@ApiTags('Foods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'foods', version: '1' })
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get('categories')
  findAllCategories() {
    return this.foodsService.findAllCategories();
  }

  @ApiQuery({ name: 'category', required: false })
  @Get()
  findMany(@Query('category') category?: string) {
    return this.foodsService.findManyByCategory(category ?? '');
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.foodsService.findById(id);
  }
}
