import { Inject, Injectable } from '@nestjs/common';
import { LogoutAuthApplication } from '../interfaces/applications/logout-auth.application.interface';
import { LogoutAuthResult } from '../interfaces/services/logout-auth.service.interface';
import { type LogoutAuthService } from '../interfaces/services/logout-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class LogoutAuthApplicationImpl implements LogoutAuthApplication {
  constructor(
    @Inject(AUTH_TYPES.services.LogoutAuthService)
    private readonly service: LogoutAuthService,
  ) {}

  logout(refreshToken?: string): Promise<LogoutAuthResult> {
    return this.service.logout(refreshToken);
  }
}
