import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.resolveStatus(exception);
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const errors = this.resolveErrors(exceptionResponse);
    const message = this.resolveMessage(exception, exceptionResponse);

    this.logException(exception, status);

    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (exception instanceof MulterError) return HttpStatus.BAD_REQUEST;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown, exceptionResponse: unknown): string {
    if (exception instanceof MulterError) {
      return exception.code === 'LIMIT_FILE_SIZE' ? 'حجم فایل بیش از حد مجاز است' : 'فایل ارسالی معتبر نیست';
    }
    if (typeof exceptionResponse === 'string') return exceptionResponse;
    if (this.isErrorObject(exceptionResponse)) {
      const message = exceptionResponse.message;
      if (Array.isArray(message)) return 'اطلاعات ارسال‌شده معتبر نیست';
      if (typeof message === 'string') return message;
    }
    return 'خطای داخلی سرور';
  }

  private resolveErrors(exceptionResponse: unknown): string[] {
    if (this.isErrorObject(exceptionResponse) && Array.isArray(exceptionResponse.message)) {
      return exceptionResponse.message.map(String);
    }
    return [];
  }

  private isErrorObject(value: unknown): value is { message?: unknown } {
    return typeof value === 'object' && value !== null;
  }

  private logException(exception: unknown, status: number): void {
    if (status < HttpStatus.INTERNAL_SERVER_ERROR) return;

    if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      return;
    }

    this.logger.error(this.stringifyException(exception));
  }

  private stringifyException(exception: unknown): string {
    try {
      return JSON.stringify(exception);
    } catch {
      return String(exception);
    }
  }
}
