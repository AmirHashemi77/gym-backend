import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/entities/jwt-user.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramsQueryDto } from './dto/programs-query.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramsService } from './services/programs.service';

@ApiTags('Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'programs', version: '1' })
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Roles(Role.ADMIN, Role.COACH)
  @Post()
  create(@Body() dto: CreateProgramDto, @CurrentUser() user: JwtUser) {
    return this.programsService.create(dto, user);
  }

  @ApiQuery({ name: 'studentId', required: false })
  @Get()
  findMany(@Query() query: ProgramsQueryDto, @CurrentUser() user: JwtUser) {
    return this.programsService.findMany(query, user, query.studentId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.programsService.findById(id, user);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProgramDto, @CurrentUser() user: JwtUser) {
    return this.programsService.update(id, dto, user);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.programsService.remove(id, user);
  }
}
