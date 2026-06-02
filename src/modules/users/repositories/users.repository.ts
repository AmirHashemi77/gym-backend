import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPagination } from '../../../common/utils/pagination.util';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  createStudent(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data, include: { studentProfile: true } });
  }

  findStudents(query: PaginationQueryDto) {
    const { skip, take } = getPagination(query);
    const where: Prisma.UserWhereInput = {
      role: Role.STUDENT,
      deletedAt: null,
      OR: query.search
        ? [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: { studentProfile: true },
      }),
      this.prisma.user.count({ where }),
    ]);
  }

  findStudentById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, role: Role.STUDENT, deletedAt: null },
      include: { studentProfile: true, studentPrograms: { where: { deletedAt: null } } },
    });
  }

  updateStudent(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, include: { studentProfile: true } });
  }

  softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        studentProfile: { update: { deletedAt: new Date() } },
      },
    });
  }
}
