import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { copyFile, mkdir, rename, rm, writeFile } from 'fs/promises';
import { dirname, extname, join } from 'path';

@Injectable()
export class UploadService {
  private readonly allowedVideoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  private readonly allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  constructor(private readonly config: ConfigService) {}

  async uploadVideo(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('فایل ارسال نشده است');
    if (!this.allowedVideoMimeTypes.includes(file.mimetype)) throw new BadRequestException('فرمت ویدیو معتبر نیست');
    const maxSize = this.config.get<number>('MAX_VIDEO_SIZE_MB', 200) * 1024 * 1024;
    if (file.size > maxSize) throw new BadRequestException('حجم فایل بیش از حد مجاز است');

    const key = `videos/${randomUUID()}${extname(file.originalname) || '.mp4'}`;
    return this.finalizeUpload(file, key, 'ویدیو آپلود شد');
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('فایل ارسال نشده است');
    if (!this.allowedImageMimeTypes.includes(file.mimetype)) throw new BadRequestException('فرمت تصویر معتبر نیست');
    const maxSize = this.config.get<number>('MAX_IMAGE_SIZE_MB', 10) * 1024 * 1024;
    if (file.size > maxSize) throw new BadRequestException('حجم فایل بیش از حد مجاز است');

    const key = `images/${randomUUID()}${extname(file.originalname) || '.jpg'}`;
    return this.finalizeUpload(file, key, 'تصویر آپلود شد');
  }

  private async finalizeUpload(file: Express.Multer.File, key: string, message: string) {
    const url = await this.uploadToStorage(key, file);
    return {
      message,
      data: {
        url,
        thumbnailUrl: file.mimetype.startsWith('video/') ? null : undefined,
        key,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }

  private async uploadToStorage(key: string, file: Express.Multer.File): Promise<string> {
    try {
      return await this.uploadToS3OrLocal(key, file);
    } finally {
      await this.cleanupTempFile(file);
    }
  }

  private async uploadToS3OrLocal(key: string, file: Express.Multer.File): Promise<string> {
    const bucket = this.config.get<string>('S3_BUCKET');
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY');

    if (bucket && endpoint && accessKeyId && secretAccessKey) {
      const client = new S3Client({
        endpoint,
        region: this.config.get<string>('S3_REGION', 'auto'),
        forcePathStyle: true,
        credentials: { accessKeyId, secretAccessKey },
      });
      const body = file.path ? createReadStream(file.path) : file.buffer;
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: file.mimetype }),
      );

      const baseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL') || endpoint;
      return `${baseUrl.replace(/\/$/, '')}/${key}`;
    }

    return this.saveToLocalUploads(key, file);
  }

  private async saveToLocalUploads(key: string, file: Express.Multer.File): Promise<string> {
    const destinationPath = join(process.cwd(), 'public', 'uploads', key);
    await mkdir(dirname(destinationPath), { recursive: true });

    if (file.path) {
      await this.moveFile(file.path, destinationPath);
    } else if (file.buffer) {
      await writeFile(destinationPath, file.buffer);
    } else {
      throw new BadRequestException('فایل قابل پردازش نیست');
    }

    return `/uploads/${key}`;
  }

  /**
   * Temp files live on the container filesystem while production uploads live
   * on a Docker volume. rename(2) cannot cross those filesystem boundaries,
   * so fall back to copy + unlink when Linux reports EXDEV.
   */
  private async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      await rename(sourcePath, destinationPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
      await copyFile(sourcePath, destinationPath);
      await rm(sourcePath, { force: true });
    }
  }

  private async cleanupTempFile(file: Express.Multer.File): Promise<void> {
    if (!file.path) return;
    await rm(file.path, { force: true }).catch(() => {});
  }
}
