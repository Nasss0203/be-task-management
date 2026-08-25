import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateDefaultWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.command';
import { CreateDefaultWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.handler';
import {
  type UserRecord,
  type UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IssueAuthTokenServiceImpl } from '../../services/issue-auth-token.service';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
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
    private readonly issueAuthTokenService: IssueAuthTokenServiceImpl,
    private readonly createDefaultWorkspaceHandler: CreateDefaultWorkspaceHandler,
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
        user = await this.userRepository.createGoogleUser({
          email: googleUser.email,
          username: this.generateUsername(googleUser),
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl ?? null,
        });

        await this.createDefaultWorkspaceHandler.execute(
          new CreateDefaultWorkspaceCommand(user.id),
        );
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
