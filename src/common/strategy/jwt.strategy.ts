import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuth } from 'src/types/auth';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const jwtAccessTokenSecret = configService.get<string>(
      'JWT_ACCESS_TOKEN_SECRET',
    );
    if (!jwtAccessTokenSecret) {
      throw new Error(
        'JWT_ACCESS_TOKEN_SECRET is not defined in environment variables',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtAccessTokenSecret,
    });
  }

  async validate(payload: IAuth) {
    const { id, email, username } = payload;
    return { id, email, username };
  }
}
