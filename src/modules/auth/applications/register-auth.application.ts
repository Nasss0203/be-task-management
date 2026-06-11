import { Inject, Injectable } from '@nestjs/common';
import { RegisterUserDto } from 'src/modules/users/dto/create-user.dto';
import { RegisterAuthApplication } from '../interfaces/applications/register-auth.application.interface';
import {
  RegisterAuthResult,
  type RegisterAuthService,
} from '../interfaces/services/register-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class RegisterAuthApplicationImpl implements RegisterAuthApplication {
  constructor(
    @Inject(AUTH_TYPES.services.RegisterAuthService)
    private readonly service: RegisterAuthService,
  ) {}

  register(registerUserDto: RegisterUserDto): Promise<RegisterAuthResult> {
    return this.service.register(registerUserDto);
  }
}
