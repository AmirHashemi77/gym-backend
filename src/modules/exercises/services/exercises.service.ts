import { Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { ExercisesRepository } from '../repositories/exercises.repository';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { getPaginationMeta } from '../../../common/utils/pagination.util';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly exercisesRepository: ExercisesRepository) {}

  async create(dto: CreateExerciseDto, createdBy: string) {
    const slug = await this.createUniqueSlug(dto.title);
    const exercise = await this.exercisesRepository.create({
      title: dto.title,
      slug,
      description: dto.description,
      videoUrl: dto.videoUrl,
      thumbnailUrl: dto.thumbnailUrl,
      creator: { connect: { id: createdBy } },
    });
    return { message: 'حرکت ایجاد شد', data: exercise };
  }

  async findPopular(limit: number) {
    const exercises = await this.exercisesRepository.findPopular(limit);
    return { data: exercises };
  }

  async findMany(query: PaginationQueryDto) {
    const [items, total] = await this.exercisesRepository.findMany(query);
    return { data: { items, meta: getPaginationMeta(query.page, query.limit, total) } };
  }

  async findById(id: string) {
    const exercise = await this.exercisesRepository.findById(id);
    if (!exercise) throw new NotFoundException('حرکت یافت نشد');
    return { data: exercise };
  }

  async update(id: string, dto: UpdateExerciseDto) {
    await this.ensureExercise(id);
    const data = {
      title: dto.title,
      slug: dto.title ? await this.createUniqueSlug(dto.title, id) : undefined,
      description: dto.description,
      videoUrl: dto.videoUrl,
      thumbnailUrl: dto.thumbnailUrl,
    };
    const exercise = await this.exercisesRepository.update(id, data);
    return { message: 'حرکت ویرایش شد', data: exercise };
  }

  async remove(id: string) {
    await this.ensureExercise(id);
    await this.exercisesRepository.softDelete(id);
    return { message: 'حرکت حذف شد', data: null };
  }

  async bookmark(studentId: string, exerciseId: string) {
    await this.ensureExercise(exerciseId);
    const bookmark = await this.exercisesRepository.bookmark(studentId, exerciseId);
    return { message: 'حرکت بوکمارک شد', data: bookmark };
  }

  async unbookmark(studentId: string, exerciseId: string) {
    await this.exercisesRepository.unbookmark(studentId, exerciseId);
    return { message: 'بوکمارک حذف شد', data: null };
  }

  private async ensureExercise(id: string): Promise<void> {
    const exercise = await this.exercisesRepository.findById(id);
    if (!exercise) throw new NotFoundException('حرکت یافت نشد');
  }

  private async createUniqueSlug(title: string, currentId?: string): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true, locale: 'fa' }) || Date.now().toString();
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const exists = await this.exercisesRepository.findBySlug(slug);
      if (!exists || exists.id === currentId) return slug;
      slug = `${baseSlug}-${counter++}`;
    }
  }
}
