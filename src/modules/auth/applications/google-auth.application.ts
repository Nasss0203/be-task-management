import { Inject, Injectable } from '@nestjs/common';
import { GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { GoogleAuthApplication } from '../interfaces/applications/google-auth.application.interface';
import {
  GoogleAuthResult,
  type GoogleAuthService,
} from '../interfaces/services/google-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class GoogleAuthApplicationImpl implements GoogleAuthApplication {
  constructor(
    @Inject(AUTH_TYPES.services.GoogleAuthService)
    private readonly service: GoogleAuthService,
  ) {}

  loginWithGoogle(googleUser: GoogleUserPayload): Promise<GoogleAuthResult> {
    return this.service.loginWithGoogle(googleUser);
  }
}
