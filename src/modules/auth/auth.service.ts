import { Inject, Injectable } from '@nestjs/common';
import { IAuth } from 'src/types/auth';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { type GetProfileAuthApplication } from './interfaces/applications/get-profile-auth.application.interface';
import { type LoginAuthApplication } from './interfaces/applications/login-auth.application.interface';
import { type LogoutAuthApplication } from './interfaces/applications/logout-auth.application.interface';
import { type RefreshAuthApplication } from './interfaces/applications/refresh-auth.application.interface';
import { type RegisterAuthApplication } from './interfaces/applications/register-auth.application.interface';
import { IUserJwtPayload } from './interfaces/type';
import { type ValidateUserAuthService } from './interfaces/services/validate-user-auth.service.interface';
import { AUTH_TYPES } from './interfaces/types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_TYPES.applications.RegisterAuthApplication)
    private readonly registerAuthApplication: RegisterAuthApplication,
    @Inject(AUTH_TYPES.applications.LoginAuthApplication)
    private readonly loginAuthApplication: LoginAuthApplication,
    @Inject(AUTH_TYPES.applications.RefreshAuthApplication)
    private readonly refreshAuthApplication: RefreshAuthApplication,
    @Inject(AUTH_TYPES.applications.LogoutAuthApplication)
    private readonly logoutAuthApplication: LogoutAuthApplication,
    @Inject(AUTH_TYPES.applications.GetProfileAuthApplication)
    private readonly getProfileAuthApplication: GetProfileAuthApplication,
    @Inject(AUTH_TYPES.services.ValidateUserAuthService)
    private readonly validateUserAuthService: ValidateUserAuthService,
  ) {}

  register(registerUserDto: RegisterUserDto) {
    return this.registerAuthApplication.register(registerUserDto);
  }

  login(auth: IAuth) {
    return this.loginAuthApplication.login(auth);
  }

  refresh(refreshToken?: string) {
    return this.refreshAuthApplication.refresh(refreshToken);
  }

  logout(refreshToken?: string) {
    return this.logoutAuthApplication.logout(refreshToken);
  }

  validateUser(email: string, password: string) {
    return this.validateUserAuthService.validateUser(email, password);
  }

  comparePassword(password: string, hash: string) {
    return this.validateUserAuthService.comparePassword(password, hash);
  }

  getProfile(payload: IUserJwtPayload) {
    return this.getProfileAuthApplication.getProfile(payload);
  }
}
