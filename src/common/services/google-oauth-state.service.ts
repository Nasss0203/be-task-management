import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
  GOOGLE_OAUTH_STATE_BYTE_LENGTH,
  GOOGLE_OAUTH_STATE_ENCODED_LENGTH,
} from 'src/common/constants/google-oauth-state.constant';

const GOOGLE_OAUTH_STATE_PATTERN = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const GOOGLE_OAUTH_STATE_ERROR_MESSAGE = 'Unable to authenticate with Google';

@Injectable()
export class GoogleOAuthStateService {
  generateState(): string {
    return randomBytes(GOOGLE_OAUTH_STATE_BYTE_LENGTH).toString('base64url');
  }

  assertValid(receivedState: unknown, storedState: unknown): void {
    if (!this.isValidState(receivedState) || !this.isValidState(storedState)) {
      throw this.createUnauthorizedException();
    }

    const receivedStateBuffer = Buffer.from(receivedState, 'base64url');
    const storedStateBuffer = Buffer.from(storedState, 'base64url');

    if (
      receivedStateBuffer.length !== GOOGLE_OAUTH_STATE_BYTE_LENGTH ||
      storedStateBuffer.length !== GOOGLE_OAUTH_STATE_BYTE_LENGTH ||
      receivedStateBuffer.length !== storedStateBuffer.length ||
      !timingSafeEqual(receivedStateBuffer, storedStateBuffer)
    ) {
      throw this.createUnauthorizedException();
    }
  }

  private isValidState(state: unknown): state is string {
    return (
      typeof state === 'string' &&
      state.length === GOOGLE_OAUTH_STATE_ENCODED_LENGTH &&
      GOOGLE_OAUTH_STATE_PATTERN.test(state)
    );
  }

  private createUnauthorizedException(): UnauthorizedException {
    return new UnauthorizedException(GOOGLE_OAUTH_STATE_ERROR_MESSAGE);
  }
}
