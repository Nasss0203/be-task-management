import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';
import { RegisterUserDto } from 'src/modules/users/dto/create-user.dto';
import { CreateWorkspaceService } from 'src/modules/workspaces/interfaces/services/create-workspace.service.interface';
import { hashToken } from 'src/utils';
import { AuthRefreshTokenRepository } from '../interfaces/repositories/auth-refresh-token.repository.interface';
import { AuthUserRepository } from '../interfaces/repositories/auth-user.repository.interface';
import { IssueAuthTokenService } from '../interfaces/services/issue-auth-token.service.interface';
import { GetProfileAuthServiceImpl } from './get-profile-auth.service';
import { GoogleAuthServiceImpl } from './google-auth.service';
import { IssueAuthTokenServiceImpl } from './issue-auth-token.service';
import { LoginAuthServiceImpl } from './login-auth.service';
import { LogoutAuthServiceImpl } from './logout-auth.service';
import { RefreshAuthServiceImpl } from './refresh-auth.service';
import { RegisterAuthServiceImpl } from './register-auth.service';
import { ValidateUserAuthServiceImpl } from './validate-user-auth.service';

const createUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'user@example.com',
    username: 'user',
    passwordHash: 'hashed-password',
    googleId: null,
    avatarUrl: null,
    isActive: true,
    systemRole: SystemRole.USER,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  }) as User;

const createRefreshToken = (
  overrides: Partial<RefreshToken> = {},
): RefreshToken =>
  ({
    id: 'refresh-token-1',
    user_id: 'user-1',
    token: hashToken('refresh-token'),
    user: createUser(),
    expires_at: new Date(Date.now() + 60_000),
    revoked_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as RefreshToken;

const createUserRepositoryMock = (): jest.Mocked<AuthUserRepository> => ({
  findByEmail: jest.fn(),
  findByGoogleId: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  findByEmailAndUsername: jest.fn(),
  findProfileById: jest.fn(),
  createLocalUser: jest.fn(),
  createGoogleUser: jest.fn(),
  save: jest.fn(),
});

const createRefreshTokenRepositoryMock =
  (): jest.Mocked<AuthRefreshTokenRepository> => ({
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    findByTokenHashWithUser: jest.fn(),
    save: jest.fn(),
  });

const createIssueTokenServiceMock = (): jest.Mocked<IssueAuthTokenService> => ({
  issueTokens: jest.fn(),
});

const createWorkspaceServiceMock = (): jest.Mocked<CreateWorkspaceService> =>
  ({
    create: jest.fn(),
    createDefault: jest.fn(),
  }) as unknown as jest.Mocked<CreateWorkspaceService>;

describe('Auth services', () => {
  describe('RegisterAuthServiceImpl', () => {
    it('throws when email or username already exists', async () => {
      const userRepository = createUserRepositoryMock();
      const createWorkspaceService = createWorkspaceServiceMock();
      const service = new RegisterAuthServiceImpl(
        userRepository,
        createWorkspaceService,
      );
      userRepository.findByEmailOrUsername.mockResolvedValue(createUser());

      await expect(
        service.register({
          email: 'user@example.com',
          username: 'user',
          password: 'password',
        } as RegisterUserDto),
      ).rejects.toMatchObject({
        response: {
          code: ErrorCode.USER_ALREADY_EXISTS,
        },
        status: HttpStatus.BAD_REQUEST,
      });
      expect(userRepository.createLocalUser).not.toHaveBeenCalled();
    });

    it('creates user and default workspace', async () => {
      const userRepository = createUserRepositoryMock();
      const createWorkspaceService = createWorkspaceServiceMock();
      const service = new RegisterAuthServiceImpl(
        userRepository,
        createWorkspaceService,
      );
      const user = createUser();

      userRepository.findByEmailOrUsername.mockResolvedValue(null);
      userRepository.createLocalUser.mockResolvedValue(user);

      const result = await service.register({
        email: user.email,
        username: user.username,
        password: 'password',
      } as RegisterUserDto);

      expect(userRepository.createLocalUser).toHaveBeenCalledWith({
        email: user.email,
        username: user.username,
        passwordHash: expect.any(String),
      });
      expect(createWorkspaceService.createDefault).toHaveBeenCalledWith({
        userId: user.id,
      });
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });
  });

  describe('LoginAuthServiceImpl', () => {
    it('issues tokens when user is active', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new LoginAuthServiceImpl(
        userRepository,
        issueTokenService,
      );
      const user = createUser();

      userRepository.findByEmailAndUsername.mockResolvedValue(user);
      issueTokenService.issueTokens.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });

      await expect(
        service.login({
          id: user.id,
          email: user.email,
          username: user.username,
          systemRole: user.systemRole,
        }),
      ).resolves.toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      expect(issueTokenService.issueTokens).toHaveBeenCalledWith(user);
    });

    it('throws when user is missing or inactive', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new LoginAuthServiceImpl(
        userRepository,
        issueTokenService,
      );

      userRepository.findByEmailAndUsername.mockResolvedValue(null);

      await expect(
        service.login({
          id: 'user-1',
          email: 'user@example.com',
          username: 'user',
          systemRole: SystemRole.USER,
        }),
      ).rejects.toBeInstanceOf(HttpException);
      expect(issueTokenService.issueTokens).not.toHaveBeenCalled();
    });
  });

  describe('RefreshAuthServiceImpl', () => {
    it('throws when refresh token is missing', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new RefreshAuthServiceImpl(
        refreshTokenRepository,
        issueTokenService,
      );

      await expect(service.refresh()).rejects.toMatchObject({
        response: {
          code: ErrorCode.AUTH_INVALID_TOKEN,
        },
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('revokes current token and issues a new token pair', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new RefreshAuthServiceImpl(
        refreshTokenRepository,
        issueTokenService,
      );
      const stored = createRefreshToken();

      refreshTokenRepository.findByTokenHashWithUser.mockResolvedValue(stored);
      issueTokenService.issueTokens.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });

      await expect(service.refresh('refresh-token')).resolves.toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
      expect(stored.revoked_at).toBeInstanceOf(Date);
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(stored);
      expect(issueTokenService.issueTokens).toHaveBeenCalledWith(stored.user);
    });
  });

  describe('LogoutAuthServiceImpl', () => {
    it('returns success when refresh token is not provided', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const service = new LogoutAuthServiceImpl(refreshTokenRepository);

      await expect(service.logout()).resolves.toEqual({ success: true });
      expect(refreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
    });

    it('revokes active refresh token', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const service = new LogoutAuthServiceImpl(refreshTokenRepository);
      const stored = createRefreshToken();

      refreshTokenRepository.findByTokenHash.mockResolvedValue(stored);

      await expect(service.logout('refresh-token')).resolves.toEqual({
        success: true,
      });
      expect(stored.revoked_at).toBeInstanceOf(Date);
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(stored);
    });
  });

  describe('GetProfileAuthServiceImpl', () => {
    it('returns active user profile', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new GetProfileAuthServiceImpl(userRepository);
      const user = createUser();

      userRepository.findProfileById.mockResolvedValue(user);

      await expect(
        service.getProfile({
          sub: user.id,
          id: user.id,
          email: user.email,
          username: user.username,
          systemRole: user.systemRole,
        }),
      ).resolves.toBe(user);
    });

    it('throws when user is not found', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new GetProfileAuthServiceImpl(userRepository);

      userRepository.findProfileById.mockResolvedValue(null);

      await expect(
        service.getProfile({
          sub: 'user-1',
          id: 'user-1',
          email: 'user@example.com',
          username: 'user',
          systemRole: SystemRole.USER,
        }),
      ).rejects.toMatchObject({
        response: {
          code: ErrorCode.USER_NOT_FOUND,
        },
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('ValidateUserAuthServiceImpl', () => {
    it('returns null when user is missing, inactive, or has no password', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new ValidateUserAuthServiceImpl(userRepository);

      userRepository.findByEmail.mockResolvedValue(
        createUser({ isActive: false }),
      );

      await expect(
        service.validateUser('user@example.com', 'password'),
      ).resolves.toBeNull();
    });

    it('returns user when password is valid', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new ValidateUserAuthServiceImpl(userRepository);
      const user = createUser();

      userRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(service, 'comparePassword').mockReturnValue(true);

      await expect(service.validateUser(user.email, 'password')).resolves.toBe(
        user,
      );
    });
  });

  describe('IssueAuthTokenServiceImpl', () => {
    it('signs access token and stores hashed refresh token', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const jwt = {
        sign: jest.fn().mockReturnValue('access-token'),
      } as unknown as JwtService;
      const service = new IssueAuthTokenServiceImpl(
        jwt,
        refreshTokenRepository,
      );
      const user = createUser();

      const result = await service.issueTokens(user);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          sub: user.id,
          id: user.id,
          email: user.email,
          username: user.username,
          systemRole: user.systemRole,
        },
        { expiresIn: '15m' },
      );
      expect(refreshTokenRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        tokenHash: hashToken(result.refresh_token),
        expiresAt: expect.any(Date),
      });
      expect(result.access_token).toBe('access-token');
      expect(result.refresh_token).toEqual(expect.any(String));
    });
  });

  describe('GoogleAuthServiceImpl', () => {
    it('creates user and default workspace when google user is new', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const createWorkspaceService = createWorkspaceServiceMock();
      const service = new GoogleAuthServiceImpl(
        userRepository,
        issueTokenService,
        createWorkspaceService,
      );
      const user = createUser({
        googleId: 'google-1',
        avatarUrl: 'https://example.com/avatar.png',
      });

      userRepository.findByGoogleId.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createGoogleUser.mockResolvedValue(user);
      issueTokenService.issueTokens.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });

      await expect(
        service.loginWithGoogle({
          googleId: 'google-1',
          email: user.email,
          avatarUrl: user.avatarUrl ?? undefined,
        }),
      ).resolves.toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user,
      });
      expect(userRepository.createGoogleUser).toHaveBeenCalledWith({
        email: user.email,
        username: expect.stringMatching(/^user_/),
        googleId: 'google-1',
        avatarUrl: user.avatarUrl,
      });
      expect(createWorkspaceService.createDefault).toHaveBeenCalledWith({
        userId: user.id,
      });
    });
  });
});
