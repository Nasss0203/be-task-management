import {
  type CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

const INTERNAL_TEMPLATE_RENDER_HEADER = 'x-template-render-key';
const TEMPLATE_RENDER_INTERNAL_KEY_ENV = 'TEMPLATE_RENDER_INTERNAL_KEY';

@Injectable()
export class InternalTemplateRenderGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
    }>();

    const providedKey = request.headers?.[INTERNAL_TEMPLATE_RENDER_HEADER];

    if (typeof providedKey !== 'string' || providedKey.length === 0) {
      throw new UnauthorizedException('Invalid internal render key');
    }

    const expectedKey = this.configService.getOrThrow<string>(
      TEMPLATE_RENDER_INTERNAL_KEY_ENV,
    );

    if (expectedKey.length === 0) {
      throw new Error(`${TEMPLATE_RENDER_INTERNAL_KEY_ENV} must not be empty`);
    }

    const providedBuffer = Buffer.from(providedKey, 'utf8');
    const expectedBuffer = Buffer.from(expectedKey, 'utf8');

    if (providedBuffer.length !== expectedBuffer.length) {
      throw new UnauthorizedException('Invalid internal render key');
    }

    const isValid = timingSafeEqual(providedBuffer, expectedBuffer);

    if (!isValid) {
      throw new UnauthorizedException('Invalid internal render key');
    }

    return true;
  }
}
