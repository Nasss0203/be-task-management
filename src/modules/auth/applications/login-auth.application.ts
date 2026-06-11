import { Inject, Injectable } from '@nestjs/common';
import { IAuth } from 'src/types/auth';
import { LoginAuthApplication } from '../interfaces/applications/login-auth.application.interface';
import { AuthTokenPair } from '../interfaces/services/issue-auth-token.service.interface';
import { type LoginAuthService } from '../interfaces/services/login-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class LoginAuthApplicationImpl implements LoginAuthApplication {
  constructor(
    @Inject(AUTH_TYPES.services.LoginAuthService)
    private readonly service: LoginAuthService,
  ) {}

  login(auth: IAuth): Promise<AuthTokenPair> {
    return this.service.login(auth);
  }
}
