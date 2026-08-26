import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UserProfileAggregate } from 'src/modules/identity/domain/aggregates/user-profile/user-profile.aggregate';
import { type UserProfileRepository } from 'src/modules/identity/domain/repositories/user-profile.repository';
import {
  type UserRecord,
  type UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { CreateDefaultWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.command';
import { CreateDefaultWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.handler';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { IssueAuthTokenServiceImpl } from '../../services/issue-auth-token.service';
import { GoogleAuthCommand } from './google-auth.command';

export type GoogleAuthResult = {
  access_token: string;
  refresh_token: string;
  user: UserRecord;
};

@Injectable()
export class GoogleAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(IDENTITY_TYPES.repositories.UserProfileRepository)
    private readonly userProfileRepository: UserProfileRepository,

    private readonly issueAuthTokenService: IssueAuthTokenServiceImpl,
    private readonly createDefaultWorkspaceHandler: CreateDefaultWorkspaceHandler,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: GoogleAuthCommand): Promise<GoogleAuthResult> {
    const { googleUser } = command;

    let user = await this.userRepository.findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.userRepository.findByEmail(googleUser.email);

      if (user) {
        user.googleId = googleUser.googleId;

        if (!user.avatarUrl) {
          user.avatarUrl = googleUser.avatarUrl ?? null;
        }

        user = await this.userRepository.save(user);
      } else {
        user = await this.uow.runInTransaction(async (context) => {
          const createdUser = await this.userRepository.createGoogleUser(
            {
              email: googleUser.email,
              username: this.generateUsername(googleUser),
              googleId: googleUser.googleId,
              avatarUrl: googleUser.avatarUrl ?? null,
            },
            context,
          );

          const now = new Date();

          const profile = new UserProfileAggregate(
            crypto.randomUUID(),
            createdUser.id,
            null, // lastActiveWorkspaceId
            null, // displayName
            null, // fullName
            null, // bio
            null, // phoneNumber
            null, // location
            null, // jobTitle
            null, // website
            null, // coverUrl
            null, // timezone
            null, // language
            now,
            now,
          );

          await this.userProfileRepository.save(profile, context);

          await this.createDefaultWorkspaceHandler.execute(
            new CreateDefaultWorkspaceCommand(createdUser.id),
          );

          return createdUser;
        });
      }
    }

    if (!user) {
      throw new HttpException(
        'User could not be created or found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tokens = await this.issueAuthTokenService.issueTokens(user);

    return {
      ...tokens,
      user,
    };
  }
  private generateUsername(
    googleUser: GoogleAuthCommand['googleUser'],
  ): string {
    const base =
      googleUser.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || 'user';

    return `${base}_${Date.now()}`;
  }
}
