import { type CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { type Request, type Response } from 'express';
import {
  createGoogleOAuthStateCookieClearOptions,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
} from 'src/common/constants/google-oauth-state.constant';
import { GoogleOAuthStateService } from 'src/common/services/google-oauth-state.service';

type GoogleOAuthCallbackRequest = Omit<Request, 'cookies'> & {
  cookies?: Record<string, unknown>;
};

@Injectable()
export class GoogleAuthCallbackGuard extends AuthGuard('google') {
  constructor(
    private readonly googleOAuthStateService: GoogleOAuthStateService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): ReturnType<CanActivate['canActivate']> {
    const request = context
      .switchToHttp()
      .getRequest<GoogleOAuthCallbackRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const receivedState: unknown = request.query.state;
    const storedState: unknown =
      request.cookies?.[GOOGLE_OAUTH_STATE_COOKIE_NAME];

    response.clearCookie(
      GOOGLE_OAUTH_STATE_COOKIE_NAME,
      createGoogleOAuthStateCookieClearOptions(this.configService),
    );

    this.googleOAuthStateService.assertValid(receivedState, storedState);

    return this.continueWithPassport(context);
  }

  protected continueWithPassport(
    context: ExecutionContext,
  ): ReturnType<CanActivate['canActivate']> {
    return super.canActivate(context);
  }
}
