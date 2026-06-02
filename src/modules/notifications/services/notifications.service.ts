import { Injectable } from '@nestjs/common';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  async send(dto: SendNotificationDto) {
    return {
      message: 'درخواست ارسال اعلان ثبت شد',
      data: {
        channelStatus: {
          push: 'READY',
          sms: 'READY',
          email: 'READY',
        },
        payload: dto,
      },
    };
  }
}
