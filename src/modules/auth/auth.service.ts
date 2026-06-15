import { Inject, Injectable } from '@nestjs/common';
import { IAuth } from 'src/types/auth';
import { UserActivityService } from '../user_activity/services/user_activity.service';
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

    private readonly userActivityService: UserActivityService,
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

    const saved = await this.userRepo.manager.transaction(async (manager) => {
      const user = manager.getRepository(User).create({
        email: registerUserDto.email,
        username: registerUserDto.username,
        passwordHash: hashPassword(registerUserDto.password),
        systemRole: SystemRole.USER,
        isActive: true,
        googleId: null,
        avatarUrl: null,
      });

      const createdUser = await manager.getRepository(User).save(user);

      await this.createWorkspaceService.createDefault({
        userId: createdUser.id,
        manager,
      });

      return createdUser;
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

    const tokens = await this.issueTokens(user);
    await this.userActivityService.recordLogin(user.id);

    return tokens;
  }

  refresh(refreshToken?: string) {
    return this.refreshAuthApplication.refresh(refreshToken);
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

    const tokens = await this.issueTokens(stored.user);
    await this.userActivityService.recordRefreshToken(stored.user.id);

    return tokens;
  }

  async validateUser(
    emailOrUsername: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
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
    return this.validateUserAuthService.comparePassword(password, hash);
  }

  getProfile(payload: IUserJwtPayload) {
    return this.getProfileAuthApplication.getProfile(payload);
  }
}
