-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'GLUTES', 'QUADRICEPS', 'HAMSTRINGS', 'CALVES', 'FULL_BODY', 'CARDIO');

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "muscleGroup" "MuscleGroup";

-- CreateIndex
CREATE INDEX "Exercise_muscleGroup_idx" ON "Exercise"("muscleGroup");
