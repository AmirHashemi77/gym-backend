import { Role } from '@prisma/client';

export interface JwtUser {
  sub: string;
  phone: string;
  role: Role;
}
