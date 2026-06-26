import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { CreateStudentDto } from '../dto/create-student.dto';
import { UsersRepository } from '../repositories/users.repository';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPaginationMeta } from '../../../common/utils/pagination.util';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { PrismaService } from '../../../database/prisma.service';
import { JwtUser } from '../../../common/entities/jwt-user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createStudent(dto: CreateStudentDto, currentUser: JwtUser) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])] },
    });
    if (exists) throw new ConflictException('کاربری با این شماره موبایل یا ایمیل وجود دارد');

    const password = await bcrypt.hash(dto.password, 12);
    const coachId = currentUser.role === Role.COACH ? currentUser.sub : undefined;
    const user = await this.usersRepository.createStudent({
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      password,
      role: Role.STUDENT,
      avatar: dto.avatar,
      studentProfile: {
        create: {
          coachId,
          gender: dto.gender,
          age: dto.age,
          weight: dto.weight,
          height: dto.height,
          goal: dto.goal,
        },
      },
    });
    return { message: 'ورزشکار ایجاد شد', data: user };
  }

  async findStudents(query: PaginationQueryDto) {
    const [items, total] = await this.usersRepository.findStudents(query);
    return {
      data: {
        items,
        meta: getPaginationMeta(query.page, query.limit, total),
      },
    };
  }

  async findStudentById(id: string) {
    const user = await this.usersRepository.findStudentById(id);
    if (!user) throw new NotFoundException('ورزشکار یافت نشد');
    return { data: user };
  }

  async updateStudent(id: string, dto: UpdateStudentDto) {
    await this.ensureStudent(id);
    const user = await this.usersRepository.updateStudent(id, {
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      avatar: dto.avatar,
      studentProfile: {
        upsert: {
          create: {
            gender: dto.gender,
            age: dto.age,
            weight: dto.weight,
            height: dto.height,
            goal: dto.goal,
          },
          update: {
            gender: dto.gender,
            age: dto.age,
            weight: dto.weight,
            height: dto.height,
            goal: dto.goal,
          },
        },
      },
    });
    return { message: 'اطلاعات ورزشکار ویرایش شد', data: user };
  }

  async removeStudent(id: string) {
    await this.ensureStudent(id);
    await this.usersRepository.softDelete(id);
    return { message: 'ورزشکار حذف شد', data: null };
  }

  private async ensureStudent(id: string): Promise<void> {
    const user = await this.usersRepository.findStudentById(id);
    if (!user) throw new NotFoundException('ورزشکار یافت نشد');
  }
}
