import { PrismaClient, MuscleGroup } from '@prisma/client';
import tamrinJson from '../tamrin.json';

const prisma = new PrismaClient();

interface TamrinJson {
  id: number;
  name: string;
  muscleGroup: keyof typeof MuscleGroup;
  description: string | null;
  videoUrl: string;
}

async function main(): Promise<void> {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' } });

  const data = tamrinJson as TamrinJson[];

  // Dependent rows block Exercise deletion (ExerciseBlockItem uses onDelete: Restrict).
  const { count: deletedItems } = await prisma.exerciseBlockItem.deleteMany({});
  console.log(`✓ ${deletedItems} exercise block item(s) removed`);

  const { count: deletedExercises } = await prisma.exercise.deleteMany({});
  console.log(`✓ ${deletedExercises} exercise(s) removed`);

  const exerciseRecords = data.map((ex) => ({
    title: ex.name,
    slug: `tamrin-${ex.id}`,
    description: ex.description,
    videoUrl: ex.videoUrl,
    muscleGroup: MuscleGroup[ex.muscleGroup],
    createdBy: admin.id,
  }));

  const { count } = await prisma.exercise.createMany({
    data: exerciseRecords,
    skipDuplicates: true,
  });

  console.log(`✓ ${count} exercise(s) inserted from tamrin.json`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
