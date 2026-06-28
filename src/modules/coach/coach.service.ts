import { Injectable } from '@nestjs/common';
import { QuestionStatus, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { JwtUser } from '../../common/entities/jwt-user.entity';

@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(user: JwtUser) {
    const isCoach = user.role === Role.COACH;
    const coachId = isCoach ? user.sub : undefined;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalStudents, newStudentsThisMonth, programsThisMonth, unansweredQuestions] =
      await this.prisma.$transaction([
        this.prisma.studentProfile.count({
          where: {
            deletedAt: null,
            ...(coachId ? { coachId } : {}),
          },
        }),

        this.prisma.user.count({
          where: {
            role: 'STUDENT',
            deletedAt: null,
            createdAt: { gte: startOfMonth },
            ...(coachId
              ? { studentProfile: { coachId } }
              : {}),
          },
        }),

        this.prisma.program.count({
          where: {
            deletedAt: null,
            createdAt: { gte: startOfMonth },
            ...(coachId ? { coachId } : {}),
          },
        }),

        this.prisma.question.count({
          where: {
            status: QuestionStatus.PENDING,
            deletedAt: null,
            ...(coachId
              ? { student: { studentProfile: { coachId } } }
              : {}),
          },
        }),
      ]);

    return {
      data: {
        totalStudents,
        newStudentsThisMonth,
        programsThisMonth,
        unansweredQuestions,
      },
    };
  }
}
