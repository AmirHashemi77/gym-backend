import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as webpush from 'web-push';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const email = this.config.get<string>('VAPID_EMAIL');

    if (publicKey && privateKey && email) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      this.enabled = true;
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, userId },
      create: { userId, endpoint, p256dh, auth },
    });
    return { success: true };
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return { success: true };
  }

  async sendToSubscription(
    sub: { endpoint: string; p256dh: string; auth: string },
    title: string,
    body: string,
  ) {
    if (!this.enabled) return;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body }),
      );
    } catch (err: unknown) {
      if ((err as { statusCode?: number }).statusCode === 410) {
        await this.prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } }).catch(() => {});
      } else {
        this.logger.error('Push send failed', err);
      }
    }
  }

  @Cron('* * * * *')
  async sendMealReminders() {
    if (!this.enabled) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const meals = await this.prisma.nutritionMeal.findMany({
      where: { reminderTime: currentTime },
      include: {
        plan: {
          include: {
            student: { include: { pushSubscriptions: true } },
          },
        },
      },
    });

    for (const meal of meals) {
      for (const sub of meal.plan.student.pushSubscriptions) {
        await this.sendToSubscription(sub, `وقت ${meal.label}`, meal.description.slice(0, 100));
      }
    }
  }
}
