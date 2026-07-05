import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadService } from './services/upload.service';

const tempUploadDirectory = join(process.cwd(), 'tmp', 'uploads');
const videoFileSizeLimit = 200 * 1024 * 1024;
const imageFileSizeLimit = 10 * 1024 * 1024;

const tempUploadStorage = diskStorage({
  destination: (_req, _file, callback) => {
    mkdirSync(tempUploadDirectory, { recursive: true });
    callback(null, tempUploadDirectory);
  },
  filename: (_req, file, callback) => {
    callback(null, `${randomUUID()}${extname(file.originalname)}`);
  },
});

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Roles(Role.ADMIN, Role.COACH)
  @Post('video')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: tempUploadStorage, limits: { fileSize: videoFileSizeLimit } }))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadVideo(file);
  }

  @Roles(Role.ADMIN, Role.COACH)
  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { storage: tempUploadStorage, limits: { fileSize: imageFileSizeLimit } }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadImage(file);
  }
}
