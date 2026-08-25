import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { CreateDefaultWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.command';
import { CreateDefaultWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.handler';
import { hashIdentityPassword } from 'src/modules/identity/infrastructure/security/password/password-hasher';
import { MailService } from 'src/modules/mail/mail.service';
import * as crypto from 'crypto';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { type UserRepository } from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { RegisterAuthCommand } from './register-auth.command';

export interface RegisterAuthResult {
  id: string;
  email: string;
  username: string;
}

@Injectable()
export class RegisterAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
    private readonly createDefaultWorkspaceHandler: CreateDefaultWorkspaceHandler,
    private readonly mailService: MailService,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: RegisterAuthCommand): Promise<RegisterAuthResult> {
    const { registerUserDto } = command;
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
          passwordHash: hashIdentityPassword(registerUserDto.password),
          emailVerificationToken: hashedToken,
          emailVerificationExpires: expires,
        },
        manager,
      );

      await this.createDefaultWorkspaceHandler.execute(
        new CreateDefaultWorkspaceCommand(user.id),
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
