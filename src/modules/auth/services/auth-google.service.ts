import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { CreateDefaultWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.command';
import { CreateDefaultWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.handler';
import { GoogleUserPayload } from 'src/types/google-user-payload.interface';
import { IUserJwtPayload } from '../interfaces/type';
import { hashToken } from 'src/utils';

@Injectable()
export class AuthGoogleService {
  constructor(
    private readonly jwt: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,

    private readonly createDefaultWorkspaceHandler: CreateDefaultWorkspaceHandler,
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
