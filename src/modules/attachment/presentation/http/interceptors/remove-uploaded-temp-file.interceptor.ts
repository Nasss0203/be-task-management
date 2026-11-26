import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { rm } from 'fs/promises';
import { Observable, finalize } from 'rxjs';

@Injectable()
export class RemoveUploadedTempFileInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      finalize(() => {
        const path = request.file?.path;
        if (path) void rm(path, { force: true }).catch(() => undefined);
      }),
    );
  }
}
