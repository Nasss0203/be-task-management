import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, IAuthModuleOptions } from '@nestjs/passport';
import { type Response } from 'express';
import {
  createGoogleOAuthStateCookieOptions,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
} from 'src/common/constants/google-oauth-state.constant';
import { GoogleOAuthStateService } from 'src/common/services/google-oauth-state.service';

@Injectable()
export class GoogleAuthInitiationGuard extends AuthGuard('google') {
  constructor(
    private readonly googleOAuthStateService: GoogleOAuthStateService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions {
    const response = context.switchToHttp().getResponse<Response>();
    const state = this.googleOAuthStateService.generateState();

    response.cookie(
      GOOGLE_OAUTH_STATE_COOKIE_NAME,
      state,
      createGoogleOAuthStateCookieOptions(this.configService),
    );

    return { state };
  }
}
