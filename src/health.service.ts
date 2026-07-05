import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      message: 'سرویس آماده است',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
