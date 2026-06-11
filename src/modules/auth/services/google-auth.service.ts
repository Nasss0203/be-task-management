import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type CreateWorkspaceService } from 'src/modules/workspaces/interfaces/services/create-workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { type AuthUserRepository } from '../interfaces/repositories/auth-user.repository.interface';
import { type IssueAuthTokenService } from '../interfaces/services/issue-auth-token.service.interface';
import {
  GoogleAuthResult,
  GoogleAuthService,
} from '../interfaces/services/google-auth.service.interface';
import { AUTH_TYPES } from '../interfaces/types';

@Injectable()
export class GoogleAuthServiceImpl implements GoogleAuthService {
  constructor(
    @Inject(AUTH_TYPES.repositories.AuthUserRepository)
    private readonly userRepository: AuthUserRepository,
    @Inject(AUTH_TYPES.services.IssueAuthTokenService)
    private readonly issueAuthTokenService: IssueAuthTokenService,
    @Inject(WORKSPACE_TYPES.services.CreateWorkspaceService)
    private readonly createWorkspaceService: CreateWorkspaceService,
  ) {}

  async loginWithGoogle(
    googleUser: GoogleUserPayload,
  ): Promise<GoogleAuthResult> {
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

        await this.createWorkspaceService.createDefault({
          userId: user.id,
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

  private generateUsername(googleUser: GoogleUserPayload): string {
    const base =
      googleUser.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || 'user';

    return `${base}_${Date.now()}`;
  }
}
