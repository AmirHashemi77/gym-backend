import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SendNotificationDto } from './dto/send-notification.dto';
import { PushSubscribeDto } from './dto/push-subscribe.dto';
import { PushUnsubscribeDto } from './dto/push-unsubscribe.dto';
import { NotificationsService } from './services/notifications.service';
import { WebPushService } from './services/web-push.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly webPushService: WebPushService,
  ) {}

  @Roles(Role.ADMIN, Role.COACH)
  @Post('send')
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @Roles(Role.STUDENT)
  @Post('push-subscribe')
  subscribe(@Body() dto: PushSubscribeDto, @CurrentUser('sub') userId: string) {
    return this.webPushService.subscribe(userId, dto.endpoint, dto.keys.p256dh, dto.keys.auth);
  }

  @Roles(Role.STUDENT)
  @Delete('push-subscribe')
  unsubscribe(@Body() dto: PushUnsubscribeDto) {
    return this.webPushService.unsubscribe(dto.endpoint);
  }
}
