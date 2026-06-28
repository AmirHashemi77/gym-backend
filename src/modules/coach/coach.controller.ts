import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/entities/jwt-user.entity';
import { CoachService } from './coach.service';

@ApiTags('Coach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'coach', version: '1' })
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Roles(Role.ADMIN, Role.COACH)
  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtUser) {
    return this.coachService.getDashboard(user);
  }
}
