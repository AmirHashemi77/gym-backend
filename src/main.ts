import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

function resolveCorsOrigins(frontendUrl?: string, nodeEnv?: string): string[] | boolean {
  const origins = frontendUrl
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins?.length) return origins;
  return nodeEnv === 'production' ? false : true;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useStaticAssets(join(process.cwd(), 'public'));
  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);
  const trustProxy = config.get<string>('TRUST_PROXY', 'false') === 'true';

  if (trustProxy) app.set('trust proxy', 1);

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: resolveCorsOrigins(config.get<string>('FRONTEND_URL'), config.get<string>('NODE_ENV')),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector), new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  if (config.get<string>('SWAGGER_ENABLED', 'true') === 'true') {
    const documentConfig = new DocumentBuilder()
      .setTitle('Bahman Khanmohammadi Fitness API')
      .setDescription('REST API for Persian fitness coaching platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, documentConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 1,
      },
      customSiteTitle: 'Bahman Fitness API Docs',
    });
  }

  await app.listen(config.get<number>('PORT', 3000), config.get<string>('HOST', '0.0.0.0'));
}

void bootstrap();
