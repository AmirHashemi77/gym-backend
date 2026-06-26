import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPagination } from '../../../common/utils/pagination.util';

const programInclude = {
  student: { select: { id: true, fullName: true, phone: true } },
  coach: { select: { id: true, fullName: true } },
  days: {
    orderBy: { dayNumber: 'asc' as const },
    include: {
      blocks: {
        include: {
          items: {
            orderBy: { order: 'asc' as const },
            include: { exercise: true },
          },
        },
      },
    },
  },
};

@Injectable()
export class ProgramsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ProgramCreateInput) {
    return this.prisma.program.create({ data, include: programInclude });
  }

  findMany(query: PaginationQueryDto, where: Prisma.ProgramWhereInput) {
    const { skip, take } = getPagination(query);
    return this.prisma.$transaction([
      this.prisma.program.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: programInclude,
      }),
      this.prisma.program.count({ where }),
    ]);
  }

  findById(id: string) {
    return this.prisma.program.findFirst({ where: { id, deletedAt: null }, include: programInclude });
  }

  async replace(id: string, data: Prisma.ProgramUpdateInput, days?: Prisma.ProgramDayCreateWithoutProgramInput[]) {
    return this.prisma.$transaction(async (tx) => {
      if (days) {
        await tx.programDay.deleteMany({ where: { programId: id } });
      }
      return tx.program.update({
        where: { id },
        data: {
          ...data,
          ...(days ? { days: { create: days } } : {}),
        },
        include: programInclude,
      });
    });
  }

  findActiveByStudent(studentId: string) {
    return this.prisma.program.findFirst({
      where: { studentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        durationDays: true,
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.program.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
