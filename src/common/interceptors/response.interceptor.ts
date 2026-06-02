import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface ResponsePayload<T> {
  message?: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { success: true; message: string; data: unknown }> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<{ success: true; message: string; data: unknown }> {
    return next.handle().pipe(
      map((payload: T | ResponsePayload<T>) => {
        if (payload && typeof payload === 'object' && ('data' in payload || 'message' in payload)) {
          const responsePayload = payload as ResponsePayload<T>;
          return {
            success: true,
            message: responsePayload.message ?? 'عملیات با موفقیت انجام شد',
            data: responsePayload.data ?? null,
          };
        }
        return {
          success: true,
          message: 'عملیات با موفقیت انجام شد',
          data: payload ?? null,
        };
      }),
    );
  }
}
