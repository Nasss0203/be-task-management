import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import { createFrontendCallbackUrl } from 'src/common/config/frontend-origin.config';

@Catch()
export class GoogleAuthCallbackExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(_exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    response.redirect(
      createFrontendCallbackUrl(this.configService, 'google_auth_failed'),
    );
  }
}
