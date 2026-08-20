import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { RegisterUserDto } from 'src/modules/users/dto/create-user.dto';
import { CreateWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/create-workspace/create-workspace.command';
import { CreateWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-workspace/create-workspace.handler';
import { hashPassword } from 'src/utils';
import { MailService } from 'src/modules/mail/mail.service';
import * as crypto from 'crypto';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
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
    private readonly createWorkspaceHandler: CreateWorkspaceHandler,
    private readonly mailService: MailService,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<RegisterAuthResult> {
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

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    const saved = await this.uow.runInTransaction(async (manager) => {
      const user = await this.userRepository.createLocalUser(
        {
          email: registerUserDto.email,
          username: registerUserDto.username,
          passwordHash: hashPassword(registerUserDto.password),
          emailVerificationToken: hashedToken,
          emailVerificationExpires: expires,
        },
        manager,
      );

      await this.createWorkspaceHandler.execute(
        new CreateWorkspaceCommand(user.id),
      );

      return user;
    });

    this.mailService
      .sendVerificationEmail({
        to: saved.email,
        recipientName: saved.username,
        verifyUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`,
      })
      .catch(console.error);

    return {
      id: saved.id,
      email: saved.email,
      username: saved.username,
    };
  }
}
