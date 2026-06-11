import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { RegisterUserDto } from 'src/modules/users/dto/create-user.dto';
import { type CreateWorkspaceService } from 'src/modules/workspaces/interfaces/services/create-workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { hashPassword } from 'src/utils';
import { type AuthUserRepository } from '../interfaces/repositories/auth-user.repository.interface';
import {
  RegisterAuthResult,
  RegisterAuthService,
} from '../interfaces/services/register-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class RegisterAuthServiceImpl implements RegisterAuthService {
  constructor(
    @Inject(AUTH_TYPES.repositories.AuthUserRepository)
    private readonly userRepository: AuthUserRepository,
    @Inject(WORKSPACE_TYPES.services.CreateWorkspaceService)
    private readonly createWorkspaceService: CreateWorkspaceService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<RegisterAuthResult> {
    const exists = await this.userRepository.findByEmailOrUsername(
      registerUserDto.email,
      registerUserDto.username,
    );

    if (exists) {
      throw new HttpException(
        {
          code: ErrorCode.USER_ALREADY_EXISTS,
          message: 'User already exists',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const saved = await this.userRepository.createLocalUser({
      email: registerUserDto.email,
      username: registerUserDto.username,
      passwordHash: hashPassword(registerUserDto.password),
    });

    await this.createWorkspaceService.createDefault({
      userId: saved.id,
    });

    return {
      id: saved.id,
      email: saved.email,
      username: saved.username,
    };
  }
}
