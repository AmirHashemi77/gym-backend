import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

interface StudentResponse {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  avatar: string | null;
  studentProfile: {
    id: string;
    userId: string;
    coachId: string | null;
    age: number | null;
    weight: number | null;
    height: number | null;
    goal: string | null;
  } | null;
}

loadDotEnv();

const prisma = new PrismaClient();
const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const phone = createIranPhone();
const email = `register-student-${Date.now()}@example.com`;

void main();

async function main(): Promise<void> {
  let createdUserId: string | undefined;

  try {
    const body = {
      fullName: 'Register Student Test',
      phone,
      email,
      password: 'Password123!',
      age: 28,
      weight: 81.5,
      height: 181.2,
      goal: 'Strength',
      role: 'ADMIN',
    };

    const created = await postJson<ApiResponse<StudentResponse>>(`${baseUrl}/auth/register-student`, body);

    assert.equal(created.status, 201);
    assert.equal(created.payload.success, true);
    assert.equal(created.payload.data.role, 'STUDENT');
    assert.equal(created.payload.data.phone, phone);
    assert.equal(created.payload.data.email, email);
    assert.equal(created.payload.data.studentProfile?.coachId, null);
    assert.equal(created.payload.data.studentProfile?.age, 28);
    assert.equal(created.payload.data.studentProfile?.weight, 81.5);
    assert.equal(created.payload.data.studentProfile?.height, 181.2);
    assertNoSensitivePassword(created.payload);
    createdUserId = created.payload.data.id;

    const dbUser = await prisma.user.findUnique({
      where: { id: createdUserId },
      include: { studentProfile: true },
    });

    assert.ok(dbUser);
    assert.ok(dbUser.studentProfile);
    assert.equal(dbUser.role, 'STUDENT');
    assert.notEqual(dbUser.password, body.password);

    const duplicate = await postJson<ApiResponse<null>>(`${baseUrl}/auth/register-student`, body);

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.payload.success, false);

    console.log('register-student e2e passed');
  } finally {
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  }
}

async function postJson<T>(url: string, body: unknown): Promise<{ status: number; payload: T }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  return { status: response.status, payload: (await response.json()) as T };
}

function assertNoSensitivePassword(value: unknown): void {
  const stack: unknown[] = [value];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== 'object') continue;

    for (const [key, nested] of Object.entries(current)) {
      assert.equal(/password/i.test(key), false);
      assert.notEqual(nested, 'Password123!');
      stack.push(nested);
    }
  }
}

function createIranPhone(): string {
  const suffix = String(Date.now()).slice(-7);
  return `0914${suffix}`;
}

function loadDotEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] ??= value;
  }
}
