import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsRepository } from './repositories/foods.repository';
import { FoodsService } from './services/foods.service';

@Module({
  controllers: [FoodsController],
  providers: [FoodsService, FoodsRepository],
  exports: [FoodsService],
})
export class FoodsModule {}
