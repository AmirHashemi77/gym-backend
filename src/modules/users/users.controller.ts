import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/entities/jwt-user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UsersService } from './services/users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN, Role.COACH)
  @Post('students')
  createStudent(@Body() dto: CreateStudentDto, @CurrentUser() user: JwtUser) {
    return this.usersService.createStudent(dto, user);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Get('students')
  findStudents(@Query() query: PaginationQueryDto) {
    return this.usersService.findStudents(query);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Get('students/:id')
  findStudentById(@Param('id') id: string) {
    return this.usersService.findStudentById(id);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Patch('students/:id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.usersService.updateStudent(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('students/:id')
  removeStudent(@Param('id') id: string) {
    return this.usersService.removeStudent(id);
  }
}
