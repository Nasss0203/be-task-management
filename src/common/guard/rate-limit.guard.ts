import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import {
  RATE_LIMIT_MESSAGE_METADATA,
} from 'src/common/decorator/rate-limit.decorator';
import { ErrorCode } from '../constants/error-code.constant';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    protected readonly options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    protected readonly storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async throwThrottlingException(
    context: import('@nestjs/common').ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const message = await this.getErrorMessage(context, throttlerLimitDetail);

    throw new HttpException(
      {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  protected async getErrorMessage(
    context: import('@nestjs/common').ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<string> {
    const customMessage = this.reflector.getAllAndOverride<string>(
      RATE_LIMIT_MESSAGE_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (customMessage) {
      return customMessage;
    }

    return super.getErrorMessage(context, throttlerLimitDetail);
  }
}
