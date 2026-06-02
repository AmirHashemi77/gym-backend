import { PrismaClient, Role, ExerciseBlockType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import slugify from 'slugify';

const prisma = new PrismaClient();

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

  const exerciseTitles = [
    ['اسکوات هالتر', 'حرکت پایه برای عضلات پا و باسن'],
    ['پرس سینه هالتر', 'حرکت چندمفصلی برای عضلات سینه'],
    ['ددلیفت', 'حرکت قدرتی برای زنجیره خلفی بدن'],
    ['بارفیکس', 'حرکت وزن بدن برای پشت و بازو'],
    ['پلانک', 'حرکت ایزومتریک برای عضلات مرکزی بدن'],
  ] as const;

  const exercises = [];
  for (const [title, description] of exerciseTitles) {
    const slug = slugify(title, { lower: true, strict: true, locale: 'fa' });
    const exercise = await prisma.exercise.upsert({
      where: { slug },
      update: {},
      create: {
        title,
        slug,
        description,
        videoUrl: `https://cdn.example.com/videos/${slug}.mp4`,
        thumbnailUrl: `https://cdn.example.com/thumbnails/${slug}.jpg`,
        createdBy: coach.id || admin.id,
      },
    });
    exercises.push(exercise);
  }

  await prisma.program.create({
    data: {
      title: 'برنامه چهار هفته‌ای افزایش حجم',
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
                      {
                        exerciseId: exercises[0].id,
                        sets: 4,
                        reps: '8-10',
                        rest: '90 ثانیه',
                        order: 1,
                      },
                      {
                        exerciseId: exercises[1].id,
                        sets: 4,
                        reps: '8-10',
                        rest: '90 ثانیه',
                        order: 2,
                      },
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
                      {
                        exerciseId: exercises[3].id,
                        sets: 3,
                        reps: 'تا ناتوانی کنترل‌شده',
                        rest: '120 ثانیه',
                        order: 1,
                      },
                      {
                        exerciseId: exercises[4].id,
                        sets: 3,
                        reps: '45 ثانیه',
                        rest: '120 ثانیه',
                        order: 2,
                      },
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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
