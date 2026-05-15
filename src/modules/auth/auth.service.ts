import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync } from 'bcrypt';
import { randomBytes } from 'crypto';
import { IAuth } from 'src/types/auth';
import { hashPassword, hashToken } from 'src/utils';
import { Repository } from 'typeorm';
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
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
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
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const payload: IUserJwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      systemRole: user.systemRole,
    };

    const access_token = this.jwt.sign(payload, { expiresIn: '180m' });
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

  async logout(refreshToken: string) {
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
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.isActive) {
      throw new HttpException('User is inactive', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }
}
