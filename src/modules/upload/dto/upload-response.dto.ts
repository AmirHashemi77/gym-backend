export class UploadResponseDto {
  url!: string;
  thumbnailUrl!: string | null;
  key!: string;
  mimeType!: string;
  size!: number;
}
