import {
  type CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Request } from 'express';
import { REFRESH_TOKEN_COOKIE_NAME } from 'src/common/constants/refresh-token-cookie.constant';
import { resolveAllowedFrontendOrigins } from 'src/common/config/frontend-origin.config';

type RefreshTokenOriginRequest = Omit<Request, 'cookies'> & {
  cookies?: Record<string, unknown>;
};

@Injectable()
export class RefreshTokenOriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RefreshTokenOriginRequest>();
    const hasRefreshTokenCookie = Object.prototype.hasOwnProperty.call(
      request.cookies ?? {},
      REFRESH_TOKEN_COOKIE_NAME,
    );
    const originHeader: unknown = request.headers.origin;

    if (!hasRefreshTokenCookie && originHeader === undefined) {
      return true;
    }

    if (typeof originHeader !== 'string') {
      throw this.createForbiddenException();
    }

    let normalizedOrigin: string;
    try {
      const parsedOrigin = new URL(originHeader);
      normalizedOrigin = parsedOrigin.origin;

      if (
        parsedOrigin.username ||
        parsedOrigin.password ||
        parsedOrigin.pathname !== '/' ||
        parsedOrigin.search ||
        parsedOrigin.hash
      ) {
        throw this.createForbiddenException();
      }
    } catch {
      throw this.createForbiddenException();
    }

    const allowedOrigins = resolveAllowedFrontendOrigins(this.configService);
    if (!allowedOrigins.includes(normalizedOrigin)) {
      throw this.createForbiddenException();
    }

    return true;
  }

  private createForbiddenException(): ForbiddenException {
    return new ForbiddenException('Request origin is not allowed');
  }
}
