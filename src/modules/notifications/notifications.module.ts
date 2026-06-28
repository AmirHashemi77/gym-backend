import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { WebPushService } from './services/web-push.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WebPushService],
  exports: [WebPushService],
})
export class NotificationsModule {}
