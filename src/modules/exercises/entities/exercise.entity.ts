export class ExerciseEntity {
  id!: string;
  title!: string;
  slug!: string;
  description!: string | null;
  videoUrl!: string | null;
  thumbnailUrl!: string | null;
  createdBy!: string;
  createdAt!: Date;
}
