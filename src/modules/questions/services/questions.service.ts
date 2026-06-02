import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { JwtUser } from '../../../common/entities/jwt-user.entity';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { QuestionsRepository } from '../repositories/questions.repository';

@Injectable()
export class QuestionsService {
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async create(dto: CreateQuestionDto, user: JwtUser) {
    const question = await this.questionsRepository.create({
      question: dto.question,
      student: { connect: { id: user.sub } },
      ...(dto.exerciseId ? { exercise: { connect: { id: dto.exerciseId } } } : {}),
    });
    return { message: 'سوال ثبت شد', data: question };
  }

  async findMany(query: PaginationQueryDto, user: JwtUser) {
    const where: Prisma.QuestionWhereInput = {
      deletedAt: null,
      studentId: user.role === Role.STUDENT ? user.sub : undefined,
      OR: query.search
        ? [
            { question: { contains: query.search, mode: 'insensitive' } },
            { answer: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, total] = await this.questionsRepository.findMany(query, where);
    return { data: { items, meta: getPaginationMeta(query.page, query.limit, total) } };
  }

  async answer(id: string, answer: string, user: JwtUser) {
    if (user.role === Role.STUDENT) throw new ForbiddenException('دسترسی مجاز نیست');
    const question = await this.questionsRepository.findById(id);
    if (!question) throw new NotFoundException('سوال یافت نشد');
    const updated = await this.questionsRepository.answer(id, answer);
    return { message: 'پاسخ مربی ثبت شد', data: updated };
  }
}
