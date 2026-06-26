import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPaginationMeta } from '../../../common/utils/pagination.util';
import { JwtUser } from '../../../common/entities/jwt-user.entity';
import { CreateProgramDayDto, CreateProgramDto } from '../dto/create-program.dto';
import { UpdateProgramDto } from '../dto/update-program.dto';
import { ProgramsRepository } from '../repositories/programs.repository';

@Injectable()
export class ProgramsService {
  constructor(
    private readonly programsRepository: ProgramsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateProgramDto, user: JwtUser) {
    await this.ensureStudent(dto.studentId);
    const coachId = user.role === Role.COACH ? user.sub : await this.resolveCoachId(dto.studentId);
    const program = await this.programsRepository.create({
      title: dto.title,
      durationDays: dto.durationDays,
      student: { connect: { id: dto.studentId } },
      coach: { connect: { id: coachId } },
      days: { create: this.mapDays(dto.days) },
    });
    return { message: 'برنامه تمرینی ایجاد شد', data: program };
  }

  async findMany(query: PaginationQueryDto, user: JwtUser, studentId?: string) {
    const scopedStudentId = user.role === Role.STUDENT ? user.sub : studentId;
    const where: Prisma.ProgramWhereInput = {
      deletedAt: null,
      studentId: scopedStudentId,
      coachId: user.role === Role.COACH ? user.sub : undefined,
      title: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
    };
    const [items, total] = await this.programsRepository.findMany(query, where);
    return { data: { items, meta: getPaginationMeta(query.page, query.limit, total) } };
  }

  async findById(id: string, user: JwtUser) {
    const program = await this.programsRepository.findById(id);
    if (!program) throw new NotFoundException('برنامه تمرینی یافت نشد');
    this.ensureAccess(program.studentId, program.coachId, user);
    return { data: program };
  }

  async update(id: string, dto: UpdateProgramDto, user: JwtUser) {
    const current = await this.programsRepository.findById(id);
    if (!current) throw new NotFoundException('برنامه تمرینی یافت نشد');
    this.ensureAccess(current.studentId, current.coachId, user, true);
    const program = await this.programsRepository.replace(
      id,
      { title: dto.title, ...(dto.studentId ? { student: { connect: { id: dto.studentId } } } : {}) },
      dto.days ? this.mapDays(dto.days) : undefined,
    );
    return { message: 'برنامه تمرینی ویرایش شد', data: program };
  }

  async getActiveStats(studentId: string) {
    const program = await this.programsRepository.findActiveByStudent(studentId);
    if (!program) throw new NotFoundException('برنامه فعالی یافت نشد');

    const totalDays = program.durationDays;
    const elapsedDays = Math.floor((Date.now() - program.createdAt.getTime()) / 86_400_000);
    const completedDays = Math.min(elapsedDays, totalDays);
    const remainingDays = Math.max(0, totalDays - elapsedDays);

    return { data: { programId: program.id, totalDays, completedDays, remainingDays } };
  }

  async remove(id: string, user: JwtUser) {
    const current = await this.programsRepository.findById(id);
    if (!current) throw new NotFoundException('برنامه تمرینی یافت نشد');
    this.ensureAccess(current.studentId, current.coachId, user, true);
    await this.programsRepository.softDelete(id);
    return { message: 'برنامه تمرینی حذف شد', data: null };
  }

  private mapDays(days: CreateProgramDayDto[]): Prisma.ProgramDayCreateWithoutProgramInput[] {
    return days.map((day) => ({
      dayNumber: day.dayNumber,
      blocks: {
        create: day.blocks.map((block) => ({
          type: block.type,
          note: block.note,
          items: {
            create: block.items.map((item) => ({
              exercise: { connect: { id: item.exerciseId } },
              sets: item.sets,
              reps: item.reps,
              rest: item.rest,
              order: item.order,
            })),
          },
        })),
      },
    }));
  }

  private async ensureStudent(studentId: string): Promise<void> {
    const student = await this.prisma.user.findFirst({ where: { id: studentId, role: Role.STUDENT, deletedAt: null } });
    if (!student) throw new NotFoundException('ورزشکار یافت نشد');
  }

  private async resolveCoachId(studentId: string): Promise<string> {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId: studentId } });
    if (!profile?.coachId) throw new NotFoundException('مربی ورزشکار مشخص نیست');
    return profile.coachId;
  }

  private ensureAccess(studentId: string, coachId: string, user: JwtUser, write = false): void {
    if (user.role === Role.ADMIN) return;
    if (user.role === Role.COACH && coachId === user.sub) return;
    if (!write && user.role === Role.STUDENT && studentId === user.sub) return;
    throw new ForbiddenException('دسترسی مجاز نیست');
  }
}
