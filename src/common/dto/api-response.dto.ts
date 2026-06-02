import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'عملیات با موفقیت انجام شد' })
  message!: string;

  @ApiProperty()
  data!: T;
}
