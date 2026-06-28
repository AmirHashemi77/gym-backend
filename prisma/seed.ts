import { PrismaClient, Role, ExerciseBlockType, MuscleGroup } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import slugify from 'slugify';
import exercisesJson from '../exercises.json';

const prisma = new PrismaClient();

interface ExerciseJson {
  id: string;
  name: string;
  body_part: string;
  instructions: { fa: string };
  image: string;
  gif_url: string;
}

const bodyPartToMuscleGroup: Record<string, MuscleGroup> = {
  بازو: MuscleGroup.BICEPS,
  ران: MuscleGroup.QUADRICEPS,
  ساعد: MuscleGroup.FOREARMS,
  'ساق پا': MuscleGroup.CALVES,
  سینه: MuscleGroup.CHEST,
  شانه: MuscleGroup.SHOULDERS,
  پشت: MuscleGroup.BACK,
  کاردیو: MuscleGroup.CARDIO,
  کمر: MuscleGroup.CORE,
  گردن: MuscleGroup.FULL_BODY,
};

async function main(): Promise<void> {
  const password = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { phone: '09120000000' },
    update: {},
    create: {
      fullName: 'مدیر سیستم',
      phone: '09120000000',
      email: 'admin@bahman.fit',
      password,
      role: Role.ADMIN,
    },
  });

  const coach = await prisma.user.upsert({
    where: { phone: '09121111111' },
    update: {},
    create: {
      fullName: 'بهمن خان محمدی',
      phone: '09121111111',
      email: 'coach@bahman.fit',
      password,
      role: Role.COACH,
    },
  });

  const student = await prisma.user.upsert({
    where: { phone: '09122222222' },
    update: {},
    create: {
      fullName: 'علی رضایی',
      phone: '09122222222',
      email: 'student@bahman.fit',
      password,
      role: Role.STUDENT,
      studentProfile: {
        create: {
          coachId: coach.id,
          age: 28,
          weight: '82.50',
          height: '178.00',
          goal: 'افزایش حجم عضلانی و کاهش چربی',
        },
      },
    },
  });

  // ─── Seed exercises from JSON ────────────────────────────────────────────────

  const data = exercisesJson as ExerciseJson[];

  const exerciseRecords = data.map((ex) => ({
    title: ex.name,
    slug: `ex-${ex.id}`,
    description: ex.instructions?.fa ?? null,
    imageUrl: ex.image ?? null,
    videoUrl: ex.gif_url ?? null,
    muscleGroup: bodyPartToMuscleGroup[ex.body_part] ?? null,
    createdBy: admin.id,
  }));

  const { count } = await prisma.exercise.createMany({
    data: exerciseRecords,
    skipDuplicates: true,
  });

  console.log(`✓ ${count} exercise(s) inserted from JSON`);

  // ─── Sample program ──────────────────────────────────────────────────────────

  const sampleExerciseTitles = [
    ['اسکوات هالتر', 'حرکت پایه برای عضلات پا و باسن'],
    ['پرس سینه هالتر', 'حرکت چندمفصلی برای عضلات سینه'],
    ['ددلیفت', 'حرکت قدرتی برای زنجیره خلفی بدن'],
    ['بارفیکس', 'حرکت وزن بدن برای پشت و بازو'],
    ['پلانک', 'حرکت ایزومتریک برای عضلات مرکزی بدن'],
  ] as const;

  const sampleExercises = [];
  for (const [title, description] of sampleExerciseTitles) {
    const slug = slugify(title, { lower: true, strict: true, locale: 'fa' }) || `sample-${title}`;
    const exercise = await prisma.exercise.upsert({
      where: { slug },
      update: {},
      create: { title, slug, description, createdBy: coach.id },
    });
    sampleExercises.push(exercise);
  }

  const existingProgram = await prisma.program.findFirst({
    where: { studentId: student.id, coachId: coach.id, deletedAt: null },
  });

  if (!existingProgram) {
    await prisma.program.create({
      data: {
        title: 'برنامه چهار هفته‌ای افزایش حجم',
        durationDays: 28,
        studentId: student.id,
        coachId: coach.id,
        days: {
          create: [
            {
              dayNumber: 1,
              blocks: {
                create: [
                  {
                    type: ExerciseBlockType.NORMAL,
                    note: 'با کنترل کامل و گرم کردن مناسب اجرا شود.',
                    items: {
                      create: [
                        { exerciseId: sampleExercises[0].id, sets: 4, reps: '8-10', rest: '90 ثانیه', order: 1 },
                        { exerciseId: sampleExercises[1].id, sets: 4, reps: '8-10', rest: '90 ثانیه', order: 2 },
                      ],
                    },
                  },
                ],
              },
            },
            {
              dayNumber: 2,
              blocks: {
                create: [
                  {
                    type: ExerciseBlockType.SUPERSET,
                    note: 'دو حرکت پشت سر هم با استراحت بعد از حرکت دوم.',
                    items: {
                      create: [
                        { exerciseId: sampleExercises[3].id, sets: 3, reps: 'تا ناتوانی کنترل‌شده', rest: '120 ثانیه', order: 1 },
                        { exerciseId: sampleExercises[4].id, sets: 3, reps: '45 ثانیه', rest: '120 ثانیه', order: 2 },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
