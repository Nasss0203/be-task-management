import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ErrorCode } from '../constants/error-code.constant';
import { ValidateUserAuthServiceImpl } from 'src/modules/identity/application/services/validate-user-auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly validateUserAuthService: ValidateUserAuthServiceImpl,
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
