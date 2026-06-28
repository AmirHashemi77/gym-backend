import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class PushUnsubscribeDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  endpoint!: string;
}
