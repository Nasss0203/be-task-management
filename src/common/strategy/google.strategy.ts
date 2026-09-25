import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GoogleUserPayload } from 'src/types/google-user-payload.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile', 'openid'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const subject = profile.id?.trim();
    if (!subject) {
      throw new UnauthorizedException('Invalid Google identity');
    }

    const rawEmail = profile.emails?.[0]?.value;
    const normalizedEmail = rawEmail?.trim().toLowerCase() || null;

    const user: GoogleUserPayload = {
      subject,
      email: normalizedEmail,
      emailVerified: profile.emails?.[0]?.verified === true,
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };

    done(null, user);
  }
}
