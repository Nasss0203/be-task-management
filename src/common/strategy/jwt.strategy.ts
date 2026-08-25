import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuth } from 'src/types/auth';
import { type UserRepository } from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { ErrorCode } from 'src/common/constants/error-code.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
  ) {
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
    const id = payload.id ?? payload.sub;

    if (!id) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_INVALID_TOKEN,
        message: 'Invalid token',
      });
    }

    const user = await this.userRepository.findProfileById(id);

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_INACTIVE,
        message: 'User is inactive',
      });
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      systemRole: user.systemRole,
    };
  }
}
