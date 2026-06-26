import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Gender, Prisma, Role, StudentProfile, User } from '@prisma/client';
import { LoginDto } from '../dto/login.dto';
import { AuthRepository } from '../repositories/auth.repository';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtUser } from '../../../common/entities/jwt-user.entity';
import { RegisterStudentDto } from '../dto/register-student.dto';

type UserWithGender = Pick<User, 'id' | 'fullName' | 'phone' | 'email' | 'role' | 'avatar'> & {
  studentProfile?: Pick<StudentProfile, 'gender'> | null;
};

type StudentUser = Pick<User, 'id' | 'fullName' | 'phone' | 'email' | 'role' | 'avatar'> & {
  studentProfile: Pick<StudentProfile, 'id' | 'userId' | 'coachId' | 'gender' | 'age' | 'weight' | 'height' | 'goal'> | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.authRepository.findUserByPhone(dto.phone);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }
    return { message: 'ورود با موفقیت انجام شد', data: await this.createTokenResponse(user) };
  }

  async registerStudent(dto: RegisterStudentDto) {
    const exists = await this.authRepository.findRegistrationConflict(dto.phone, dto.email);
    if (exists?.phone === dto.phone) throw new ConflictException('شماره موبایل قبلا ثبت شده است');
    if (dto.email && exists?.email === dto.email) throw new ConflictException('ایمیل قبلا ثبت شده است');

    const password = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.authRepository.registerStudent({
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        password,
        gender: dto.gender,
        age: dto.age,
        weight: dto.weight,
        height: dto.height,
        goal: dto.goal,
      });

      return { message: 'ثبت نام با موفقیت انجام شد.', data: this.sanitizeStudent(user) };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('شماره موبایل یا ایمیل قبلا ثبت شده است');
      }
      throw error;
    }
  }

  async profile(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedException('کاربر معتبر نیست');
    return { data: this.sanitizeUser(user) };
  }

  async refresh(refreshToken: string) {
    const storedToken = await this.authRepository.findRefreshToken(refreshToken);
    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date() || storedToken.user.deletedAt) {
      throw new UnauthorizedException('Refresh token معتبر نیست');
    }
    await this.authRepository.revokeRefreshToken(refreshToken);
    return {
      message: 'توکن جدید صادر شد',
      data: await this.createTokenResponse(storedToken.user),
    };
  }

  async logout(refreshToken: string) {
    const storedToken = await this.authRepository.findRefreshToken(refreshToken);
    if (storedToken && !storedToken.revokedAt) {
      await this.authRepository.revokeRefreshToken(refreshToken);
    }
    return { message: 'خروج با موفقیت انجام شد', data: null };
  }

  async changePassword(user: JwtUser, dto: ChangePasswordDto) {
    const dbUser = await this.authRepository.findUserById(user.sub);
    if (!dbUser || !(await bcrypt.compare(dto.currentPassword, dbUser.password))) {
      throw new UnauthorizedException('رمز عبور فعلی اشتباه است');
    }
    const password = await bcrypt.hash(dto.newPassword, 12);
    await this.authRepository.updatePassword(user.sub, password);
    await this.authRepository.revokeUserTokens(user.sub);
    return { message: 'رمز عبور با موفقیت تغییر کرد', data: null };
  }

  private async createTokenResponse(user: UserWithGender) {
    const payload: JwtUser = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.getJwtExpiresIn('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.getJwtExpiresIn('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
    await this.authRepository.createRefreshToken(user.id, refreshToken, this.getRefreshExpiry());
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  private getRefreshExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    return expiresAt;
  }

  private getJwtExpiresIn(key: string, fallback: JwtSignOptions['expiresIn']): JwtSignOptions['expiresIn'] {
    return (this.config.get<string>(key) ?? fallback) as JwtSignOptions['expiresIn'];
  }

  private sanitizeUser(user: UserWithGender): {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    role: Role;
    avatar: string | null;
    gender: Gender | null;
  } {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      gender: user.studentProfile?.gender ?? null,
    };
  }

  private sanitizeStudent(user: StudentUser): {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    role: Role;
    avatar: string | null;
    gender: Gender | null;
    studentProfile: {
      id: string;
      userId: string;
      coachId: string | null;
      gender: Gender | null;
      age: number | null;
      weight: number | null;
      height: number | null;
      goal: string | null;
    } | null;
  } {
    const profile = user.studentProfile;

    return {
      ...this.sanitizeUser(user),
      studentProfile: profile
        ? {
            id: profile.id,
            userId: profile.userId,
            coachId: profile.coachId,
            gender: profile.gender,
            age: profile.age,
            weight: this.decimalToNumber(profile.weight),
            height: this.decimalToNumber(profile.height),
            goal: profile.goal,
          }
        : null,
    };
  }

  private decimalToNumber(value: Prisma.Decimal | null): number | null {
    return value === null ? null : Number(value);
  }
}
