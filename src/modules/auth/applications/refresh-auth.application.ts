import { Inject, Injectable } from '@nestjs/common';
import { RefreshAuthApplication } from '../interfaces/applications/refresh-auth.application.interface';
import { AuthTokenPair } from '../interfaces/services/issue-auth-token.service.interface';
import { type RefreshAuthService } from '../interfaces/services/refresh-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class RefreshAuthApplicationImpl implements RefreshAuthApplication {
  constructor(
    @Inject(AUTH_TYPES.services.RefreshAuthService)
    private readonly service: RefreshAuthService,
  ) {}

  refresh(refreshToken?: string): Promise<AuthTokenPair> {
    return this.service.refresh(refreshToken);
  }
}
