import { Injectable, OnModuleInit } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const STATE_TTL_MS = 10 * 60_000;

export interface GoogleCalendarState {
  userId: string;
  returnTo: string;
}

@Injectable()
export class GoogleCalendarStateTokenService implements OnModuleInit {
  private secret!: string;

  onModuleInit(): void {
    const secret = process.env.SHARE_LINK_SECRET;

    if (!secret) {
      throw new Error(
        'SHARE_LINK_SECRET is not set. ' +
          'Refusing to start without it, ' +
          'since it is required to sign Google Calendar OAuth state.',
      );
    }

    this.secret = secret;
  }

  generate(state: GoogleCalendarState, now = Date.now()): string {
    const payload = Buffer.from(
      JSON.stringify({ ...state, exp: now + STATE_TTL_MS }),
      'utf8',
    ).toString('base64url');

    return `${payload}.${this.sign(payload)}`;
  }

  verify(token: unknown, now = Date.now()): GoogleCalendarState | null {
    if (typeof token !== 'string') {
      return null;
    }

    const [payload, signature, ...rest] = token.split('.');

    if (!payload || !signature || rest.length > 0) {
      return null;
    }

    const expected = Buffer.from(this.sign(payload), 'utf8');
    const received = Buffer.from(signature, 'utf8');

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }

    try {
      const decoded = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as Partial<GoogleCalendarState & { exp: number }>;

      if (
        typeof decoded.userId !== 'string' ||
        typeof decoded.returnTo !== 'string' ||
        typeof decoded.exp !== 'number' ||
        decoded.exp <= now
      ) {
        return null;
      }

      return { userId: decoded.userId, returnTo: decoded.returnTo };
    } catch {
      return null;
    }
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret)
      .update(`google-calendar-state:${payload}`)
      .digest('base64url');
  }
}
