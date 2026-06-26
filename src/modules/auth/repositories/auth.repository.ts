import { Injectable } from '@nestjs/common';
import { Gender, Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

interface RegisterStudentInput {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  gender?: Gender;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRegistrationConflict(phone: string, email?: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
      select: { id: true, phone: true, email: true },
    });
  }

  registerStudent(data: RegisterStudentInput) {
    return this.prisma.$transaction((tx) =>
      tx.user.create({
        data: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          password: data.password,
          role: Role.STUDENT,
          studentProfile: {
            create: {
              coachId: null,
              gender: data.gender,
              age: data.age,
              weight: data.weight,
              height: data.height,
              goal: data.goal,
            },
          },
        },
        include: { studentProfile: true },
      }),
    );
  }

  findUserByPhone(phone: string) {
    return this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
      include: { studentProfile: true },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { studentProfile: true },
    });
  }

  updatePassword(userId: string, password: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { password } });
  }

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { studentProfile: true } } },
    });
  }

  revokeRefreshToken(token: string) {
    return this.prisma.refreshToken.update({ where: { token }, data: { revokedAt: new Date() } });
  }

  revokeUserTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
