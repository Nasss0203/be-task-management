import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ErrorCode } from '../constants/error-code.constant';
import { type ValidateUserAuthService } from 'src/modules/auth/interfaces/services/validate-user-auth.service.interface';
import { AUTH_TYPES } from 'src/modules/auth/interfaces/types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(AUTH_TYPES.services.ValidateUserAuthService)
    private readonly validateUserAuthService: ValidateUserAuthService,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(emailOrUsername: string, password: string): Promise<any> {
    const user = await this.validateUserAuthService.validateUser(
      emailOrUsername,
      password,
    );
    if (!user) {
      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }
}
