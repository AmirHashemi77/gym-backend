import { Injectable, Logger } from '@nestjs/common';
import { Gender, Prisma, Role } from '@prisma/client';
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
  private readonly logger = new Logger(AuthRepository.name);
  private warnedAboutMissingGenderColumn = false;

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
    return this.withMissingGenderFallback(
      () =>
        this.prisma.user.findFirst({
          where: { phone, deletedAt: null },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            password: true,
            role: true,
            avatar: true,
            studentProfile: { select: { gender: true } },
          },
        }),
      () =>
        this.prisma.user.findFirst({
          where: { phone, deletedAt: null },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            password: true,
            role: true,
            avatar: true,
          },
        }),
    );
  }

  findUserById(id: string) {
    return this.withMissingGenderFallback(
      () =>
        this.prisma.user.findFirst({
          where: { id, deletedAt: null },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            password: true,
            role: true,
            avatar: true,
            studentProfile: { select: { gender: true } },
          },
        }),
      () =>
        this.prisma.user.findFirst({
          where: { id, deletedAt: null },
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            password: true,
            role: true,
            avatar: true,
          },
        }),
    );
  }

  updatePassword(userId: string, password: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { password } });
  }

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  findRefreshToken(token: string) {
    return this.withMissingGenderFallback(
      () =>
        this.prisma.refreshToken.findUnique({
          where: { token },
          select: {
            id: true,
            userId: true,
            token: true,
            expiresAt: true,
            revokedAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                password: true,
                role: true,
                avatar: true,
                deletedAt: true,
                studentProfile: { select: { gender: true } },
              },
            },
          },
        }),
      () =>
        this.prisma.refreshToken.findUnique({
          where: { token },
          select: {
            id: true,
            userId: true,
            token: true,
            expiresAt: true,
            revokedAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                password: true,
                role: true,
                avatar: true,
                deletedAt: true,
              },
            },
          },
        }),
    );
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

  private async withMissingGenderFallback<T>(queryWithGender: () => Promise<T>, queryWithoutGender: () => Promise<T>) {
    try {
      return await queryWithGender();
    } catch (error) {
      if (!this.isMissingGenderColumnError(error)) throw error;
      this.logMissingGenderWarning();
      return queryWithoutGender();
    }
  }

  private isMissingGenderColumnError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2022') {
      return false;
    }

    const column = typeof error.meta?.column === 'string' ? error.meta.column : '';
    return column === 'StudentProfile.gender' || error.message.includes('StudentProfile') || error.message.includes('gender');
  }

  private logMissingGenderWarning(): void {
    if (this.warnedAboutMissingGenderColumn) return;
    this.warnedAboutMissingGenderColumn = true;
    this.logger.warn(
      'Database schema is missing StudentProfile.gender. Auth is falling back to gender-less queries; run `prisma migrate deploy` on production.',
    );
  }
}
