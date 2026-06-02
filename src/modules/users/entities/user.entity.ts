import { Role } from '@prisma/client';

export class UserEntity {
  id!: string;
  fullName!: string;
  phone!: string;
  email!: string | null;
  role!: Role;
  avatar!: string | null;
  createdAt!: Date;
}
