import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserActivityService } from 'src/modules/user_activity/services/user_activity.service';
import { type CreateWorkspaceService } from 'src/modules/workspaces/interfaces/services/create-workspace.service.interface';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { hashToken } from 'src/utils';
import { Repository } from 'typeorm';
import { IUserJwtPayload } from '../interfaces/type';

@Injectable()
export class AuthGoogleService {
  constructor(
    private readonly jwt: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,

    @Inject(WORKSPACE_TYPES.services.CreateWorkspaceService)
    private readonly createWorkspaceService: CreateWorkspaceService,

    private readonly userActivityService: UserActivityService,
  ) {}

  async loginWithGoogle(googleUser: GoogleUserPayload) {
    let user: User | null = await this.userRepo.findOne({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      user = await this.userRepo.findOne({
        where: { email: googleUser.email },
      });

      if (user) {
        user.googleId = googleUser.googleId;

        if (!user.avatarUrl) {
          user.avatarUrl = googleUser.avatarUrl ?? null;
        }

        user = await this.userRepo.save(user);
      } else {
        const createdUser = this.userRepo.create({
          email: googleUser.email,
          username: this.generateUsername(googleUser),
          googleId: googleUser.googleId,
          avatarUrl: googleUser.avatarUrl ?? null,
          passwordHash: null,
          isActive: true,
        });

        user = await this.userRepo.save(createdUser);

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

    const payload: IUserJwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      systemRole: user.systemRole,
    };

    const access_token = this.jwt.sign(payload, { expiresIn: '15m' });

    const refresh_token = randomBytes(64).toString('hex');

    await this.refreshRepo.save({
      user_id: user.id,
      token: hashToken(refresh_token),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.userActivityService.recordLogin(user.id);

    return {
      access_token,
      refresh_token,
      user,
    };
  }

  private generateUsername(googleUser: GoogleUserPayload): string {
    const base =
      googleUser.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || 'user';

    return `${base}_${Date.now()}`;
  }
}
