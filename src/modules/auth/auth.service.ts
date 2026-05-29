import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync } from 'bcrypt';
import { randomBytes } from 'crypto';
import { IAuth } from 'src/types/auth';
import { hashPassword, hashToken } from 'src/utils';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-code.constant';
import { RefreshToken } from '../refresh_token/entities/refresh_token.entity';
import { SystemRole, User } from '../users/domain/entities/user.entity';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { type CreateWorkspaceService } from '../workspaces/interfaces/services/create-workspace.service.interface';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { IUserJwtPayload } from './interfaces/type';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,

    @Inject(WORKSPACE_TYPES.services.CreateWorkspaceService)
    private readonly createWorkspaceService: CreateWorkspaceService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const exists = await this.userRepo.findOne({
      where: [
        { email: registerUserDto.email },
        { username: registerUserDto.username },
      ],
    });

    if (exists) {
      throw new HttpException(
        {
          code: ErrorCode.USER_ALREADY_EXISTS,
          message: 'User already exists',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = this.userRepo.create({
      email: registerUserDto.email,
      username: registerUserDto.username,
      passwordHash: hashPassword(registerUserDto.password),
      systemRole: SystemRole.USER,
      isActive: true,
      googleId: null,
      avatarUrl: null,
    });

    const saved = await this.userRepo.save(user);

    await this.createWorkspaceService.createDefault({
      userId: saved.id,
    });

    return {
      id: saved.id,
      email: saved.email,
      username: saved.username,
    };
  }

  async login(auth: IAuth) {
    const { email, username } = auth;

    const user = await this.userRepo.findOne({
      where: { email, username },
    });

    if (!user || !user.isActive) {
      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.issueTokens(user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { success: true };
    }

    const tokenHash = hashToken(refreshToken);

    const stored = await this.refreshRepo.findOne({
      where: { token: tokenHash },
    });

    if (stored && !stored.revoked_at) {
      stored.revoked_at = new Date();
      await this.refreshRepo.save(stored);
    }

    return { success: true };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_TOKEN,
          message: 'Refresh token is required',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const stored = await this.refreshRepo.findOne({
      where: { token: hashToken(refreshToken) },
      relations: ['user'],
    });

    if (
      !stored ||
      stored.revoked_at ||
      stored.expires_at.getTime() <= Date.now()
    ) {
      throw new HttpException(
        {
          code: ErrorCode.AUTH_INVALID_TOKEN,
          message: 'Invalid refresh token',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!stored.user || !stored.user.isActive) {
      throw new HttpException(
        {
          code: ErrorCode.USER_INACTIVE,
          message: 'User is inactive',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    stored.revoked_at = new Date();
    await this.refreshRepo.save(stored);

    return this.issueTokens(stored.user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user || !user.isActive) {
      return null;
    }

    if (!user.passwordHash) {
      return null;
    }

    const isValid = this.comparePassword(password, user.passwordHash);
    return isValid ? user : null;
  }

  comparePassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async getProfile(payload: IUserJwtPayload) {
    const user = await this.userRepo.findOne({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        username: true,
        googleId: true,
        avatarUrl: true,
        isActive: true,
        systemRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpException(
        {
          code: ErrorCode.USER_NOT_FOUND,
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (!user.isActive) {
      throw new HttpException(
        {
          code: ErrorCode.USER_INACTIVE,
          message: 'User is inactive',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }

  private async issueTokens(user: User) {
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
    };
  }
}
