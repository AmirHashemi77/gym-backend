import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const errors = this.resolveErrors(exceptionResponse);
    const message = this.resolveMessage(exceptionResponse);

    response.status(status).json({
      success: false,
      message,
      errors,
    });
  }

  private resolveMessage(exceptionResponse: unknown): string {
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
}
