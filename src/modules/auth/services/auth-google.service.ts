import { Inject, Injectable } from '@nestjs/common';
import { GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { type GoogleAuthApplication } from '../interfaces/applications/google-auth.application.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class AuthGoogleService {
  constructor(
    @Inject(AUTH_TYPES.applications.GoogleAuthApplication)
    private readonly googleAuthApplication: GoogleAuthApplication,
  ) {}

  loginWithGoogle(googleUser: GoogleUserPayload) {
    return this.googleAuthApplication.loginWithGoogle(googleUser);
  }
}
