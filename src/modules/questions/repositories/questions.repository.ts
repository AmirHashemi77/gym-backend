import { Injectable } from '@nestjs/common';
import { Prisma, QuestionStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPagination } from '../../../common/utils/pagination.util';

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.QuestionCreateInput) {
    return this.prisma.question.create({ data, include: { exercise: true, student: { select: { id: true, fullName: true } } } });
  }

  findMany(query: PaginationQueryDto, where: Prisma.QuestionWhereInput) {
    const { skip, take } = getPagination(query);
    return this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { exercise: true, student: { select: { id: true, fullName: true, phone: true } } },
      }),
      this.prisma.question.count({ where }),
    ]);
  }

  findById(id: string) {
    return this.prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: { exercise: true, student: { select: { id: true, fullName: true } } },
    });
  }

  answer(id: string, answer: string) {
    return this.prisma.question.update({
      where: { id },
      data: { answer, status: QuestionStatus.ANSWERED },
    });
  }
}
