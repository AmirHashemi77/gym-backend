import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

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
    const url = await this.uploadToS3(key, file);
    return {
      message: 'ویدیو آپلود شد',
      data: { url, thumbnailUrl: null, key, mimeType: file.mimetype, size: file.size },
    };
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('فایل ارسال نشده است');
    if (!this.allowedImageMimeTypes.includes(file.mimetype)) throw new BadRequestException('فرمت تصویر معتبر نیست');
    const maxSize = this.config.get<number>('MAX_IMAGE_SIZE_MB', 10) * 1024 * 1024;
    if (file.size > maxSize) throw new BadRequestException('حجم فایل بیش از حد مجاز است');

    const key = `images/${randomUUID()}${extname(file.originalname) || '.jpg'}`;
    const url = await this.uploadToS3(key, file);
    return {
      message: 'تصویر آپلود شد',
      data: { url, key, mimeType: file.mimetype, size: file.size },
    };
  }

  private async uploadToS3(key: string, file: Express.Multer.File): Promise<string> {
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
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }),
      );
    }

    const baseUrl = this.config.get<string>('S3_PUBLIC_BASE_URL') || this.config.get<string>('S3_ENDPOINT') || '';
    return baseUrl ? `${baseUrl.replace(/\/$/, '')}/${key}` : `/uploads/${key}`;
  }
}
