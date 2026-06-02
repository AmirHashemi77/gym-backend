import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPagination } from '../../../common/utils/pagination.util';

@Injectable()
export class ExercisesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.ExerciseCreateInput) {
    return this.prisma.exercise.create({ data });
  }

  findMany(query: PaginationQueryDto) {
    const { skip, take } = getPagination(query);
    const where: Prisma.ExerciseWhereInput = {
      deletedAt: null,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    return this.prisma.$transaction([
      this.prisma.exercise.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { creator: { select: { id: true, fullName: true } } },
      }),
      this.prisma.exercise.count({ where }),
    ]);
  }

  findById(id: string) {
    return this.prisma.exercise.findFirst({
      where: { id, deletedAt: null },
      include: { creator: { select: { id: true, fullName: true } } },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.exercise.findUnique({ where: { slug } });
  }

  update(id: string, data: Prisma.ExerciseUpdateInput) {
    return this.prisma.exercise.update({ where: { id }, data });
  }

  softDelete(id: string) {
    return this.prisma.exercise.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  bookmark(studentId: string, exerciseId: string) {
    return this.prisma.exerciseBookmark.upsert({
      where: { studentId_exerciseId: { studentId, exerciseId } },
      update: {},
      create: { studentId, exerciseId },
    });
  }

  unbookmark(studentId: string, exerciseId: string) {
    return this.prisma.exerciseBookmark.deleteMany({ where: { studentId, exerciseId } });
  }
}
