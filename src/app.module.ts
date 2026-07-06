import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CoachModule } from './modules/coach/coach.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { FoodsModule } from './modules/foods/foods.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseModule } from './database/database.module';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';
import { validateEnvironment } from './config/validate-environment';

const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFilePath = nodeEnv === 'production' ? ['.env.production'] : [`.env.${nodeEnv}`, '.env'];

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      validate: validateEnvironment,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    ProgramsModule,
    QuestionsModule,
    UploadModule,
    NotificationsModule,
    CoachModule,
    NutritionModule,
    FoodsModule,
  ],
  providers: [
    HealthService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
