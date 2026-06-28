import { MuscleGroup } from '@prisma/client';

export class ExerciseEntity {
  id!: string;
  title!: string;
  slug!: string;
  description!: string | null;
  videoUrl!: string | null;
  thumbnailUrl!: string | null;
  muscleGroup!: MuscleGroup | null;
  imageUrl!: string | null;
  createdBy!: string;
  createdAt!: Date;
}
