import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AuthTokenEntity {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  user!: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    role: Role;
    avatar: string | null;
  };
}
