/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { RefreshToken } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/refresh-token.orm-entity';
import {
  SystemRole,
  User,
} from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { RegisterUserDto } from 'src/modules/identity/application/dto/user/create-user.dto';
import { hashToken } from 'src/utils';
import { RefreshTokenRepository } from 'src/modules/identity/domain/repositories/refresh-token.repository';
import { UserRepository } from 'src/modules/identity/domain/repositories/user.repository';
import { GetProfileAuthHandler } from './queries/get-profile-auth/get-profile-auth.handler';
import { GetProfileAuthQuery } from './queries/get-profile-auth/get-profile-auth.query';
import { GoogleAuthCommand } from './commands/google-auth/google-auth.command';
import { GoogleAuthHandler } from './commands/google-auth/google-auth.handler';
import { IssueAuthTokenServiceImpl } from './services/issue-auth-token.service';
import { LoginAuthCommand } from './commands/login-auth/login-auth.command';
import { LoginAuthHandler } from './commands/login-auth/login-auth.handler';
import { LogoutAuthCommand } from './commands/logout-auth/logout-auth.command';
import { LogoutAuthHandler } from './commands/logout-auth/logout-auth.handler';
import { RefreshAuthCommand } from './commands/refresh-auth/refresh-auth.command';
import { RefreshAuthHandler } from './commands/refresh-auth/refresh-auth.handler';
import { RegisterAuthCommand } from './commands/register-auth/register-auth.command';
import { RegisterAuthHandler } from './commands/register-auth/register-auth.handler';
import { ValidateUserAuthServiceImpl } from './services/validate-user-auth.service';

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
    isEmailVerified: true,
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

const createUserRepositoryMock = (): jest.Mocked<UserRepository> => ({
  findByEmail: jest.fn(),
  findByGoogleId: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  findByEmailAndUsername: jest.fn(),
  findProfileById: jest.fn(),
  findByEmailVerificationToken: jest.fn(),
  findByResetPasswordToken: jest.fn(),
  findUserByUsername: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  searchUsers: jest.fn(),
  searchInviteUsers: jest.fn(),
  createLocalUser: jest.fn(),
  createGoogleUser: jest.fn(),
  save: jest.fn(),
});

const createRefreshTokenRepositoryMock =
  (): jest.Mocked<RefreshTokenRepository> => ({
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    findByTokenHashWithUser: jest.fn(),
    save: jest.fn(),
  });

const createIssueTokenServiceMock = () => ({
  issueTokens: jest.fn(),
});

const createWorkspaceHandlerMock = () =>
  ({
    execute: jest.fn(),
  }) as any;

describe('Auth services', () => {
  describe('RegisterAuthHandler', () => {
    it('throws when email or username already exists', async () => {
      const userRepository = createUserRepositoryMock();
      const createWorkspaceHandler = createWorkspaceHandlerMock();
      const mailService = {
        sendVerificationEmail: jest.fn().mockResolvedValue({}),
      } as any;
      const uow = { runInTransaction: jest.fn((cb) => cb({})) } as any;
      const service = new RegisterAuthHandler(
        userRepository,
        createWorkspaceHandler,
        mailService,
        uow,
      );
      userRepository.findByEmailOrUsername.mockResolvedValue(createUser());

      await expect(
        service.execute(
          new RegisterAuthCommand({
            email: 'user@example.com',
            username: 'user',
            password: 'password',
          } as RegisterUserDto),
        ),
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
      const createWorkspaceHandler = createWorkspaceHandlerMock();
      const mailService = {
        sendVerificationEmail: jest.fn().mockResolvedValue({}),
      } as any;
      const uow = { runInTransaction: jest.fn((cb) => cb({})) } as any;
      const service = new RegisterAuthHandler(
        userRepository,
        createWorkspaceHandler,
        mailService,
        uow,
      );
      const user = createUser();

      userRepository.findByEmailOrUsername.mockResolvedValue(null);
      userRepository.createLocalUser.mockResolvedValue(user);

      const result = await service.execute(
        new RegisterAuthCommand({
          email: user.email,
          username: user.username,
          password: 'password',
        } as RegisterUserDto),
      );

      expect(userRepository.createLocalUser).toHaveBeenCalledWith(
        {
          email: user.email,
          username: user.username,
          passwordHash: expect.any(String),
          emailVerificationToken: expect.any(String),
          emailVerificationExpires: expect.any(Date),
        },
        expect.any(Object),
      );
      const [createdUserInput] = userRepository.createLocalUser.mock.calls[0];
      expect(createdUserInput.passwordHash).not.toBe('password');
      expect(createdUserInput.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(createWorkspaceHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
        }),
      );
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });
  });

  describe('LoginAuthHandler', () => {
    it('issues tokens when user is active', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new LoginAuthHandler(userRepository, issueTokenService);
      const user = createUser();

      userRepository.findByEmailAndUsername.mockResolvedValue(user);
      issueTokenService.issueTokens.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });

      await expect(
        service.execute(
          new LoginAuthCommand({
            id: user.id,
            email: user.email,
            username: user.username,
            systemRole: user.systemRole,
          }),
        ),
      ).resolves.toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
      expect(issueTokenService.issueTokens).toHaveBeenCalledWith(user);
    });

    it('throws when user is missing or inactive', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new LoginAuthHandler(userRepository, issueTokenService);

      userRepository.findByEmailAndUsername.mockResolvedValue(null);

      await expect(
        service.execute(
          new LoginAuthCommand({
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            systemRole: SystemRole.USER,
          }),
        ),
      ).rejects.toBeInstanceOf(HttpException);
      expect(issueTokenService.issueTokens).not.toHaveBeenCalled();
    });

    it('rejects an unverified non-super-admin user', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new LoginAuthHandler(userRepository, issueTokenService);
      const user = createUser({ isEmailVerified: false });

      userRepository.findByEmailAndUsername.mockResolvedValue(user);

      await expect(
        service.execute(
          new LoginAuthCommand({
            id: user.id,
            email: user.email,
            username: user.username,
            systemRole: user.systemRole,
          }),
        ),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.EMAIL_NOT_VERIFIED },
        status: HttpStatus.FORBIDDEN,
      });
      expect(issueTokenService.issueTokens).not.toHaveBeenCalled();
    });
  });

  describe('RefreshAuthHandler', () => {
    it('throws when refresh token is missing', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new RefreshAuthHandler(
        refreshTokenRepository,
        issueTokenService,
      );

      await expect(
        service.execute(new RefreshAuthCommand()),
      ).rejects.toMatchObject({
        response: {
          code: ErrorCode.AUTH_INVALID_TOKEN,
        },
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it('revokes current token and issues a new token pair', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new RefreshAuthHandler(
        refreshTokenRepository,
        issueTokenService,
      );
      const stored = createRefreshToken();

      refreshTokenRepository.findByTokenHashWithUser.mockResolvedValue(stored);
      issueTokenService.issueTokens.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });

      await expect(
        service.execute(new RefreshAuthCommand('refresh-token')),
      ).resolves.toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
      expect(stored.revoked_at).toBeInstanceOf(Date);
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(stored);
      expect(issueTokenService.issueTokens).toHaveBeenCalledWith(stored.user);
    });

    it.each([
      ['revoked', createRefreshToken({ revoked_at: new Date() })],
      [
        'expired',
        createRefreshToken({ expires_at: new Date(Date.now() - 1_000) }),
      ],
    ])('rejects a %s refresh token', async (_case, stored) => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new RefreshAuthHandler(
        refreshTokenRepository,
        issueTokenService,
      );

      refreshTokenRepository.findByTokenHashWithUser.mockResolvedValue(stored);

      await expect(
        service.execute(new RefreshAuthCommand('refresh-token')),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.AUTH_INVALID_TOKEN },
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
      expect(issueTokenService.issueTokens).not.toHaveBeenCalled();
    });

    it('rejects a token whose user is inactive', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const service = new RefreshAuthHandler(
        refreshTokenRepository,
        issueTokenService,
      );
      const stored = createRefreshToken({
        user: createUser({ isActive: false }),
      });

      refreshTokenRepository.findByTokenHashWithUser.mockResolvedValue(stored);

      await expect(
        service.execute(new RefreshAuthCommand('refresh-token')),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INACTIVE },
        status: HttpStatus.UNAUTHORIZED,
      });
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('LogoutAuthHandler', () => {
    it('returns success when refresh token is not provided', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const service = new LogoutAuthHandler(refreshTokenRepository);

      await expect(service.execute(new LogoutAuthCommand())).resolves.toEqual({
        success: true,
      });
      expect(refreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
    });

    it('revokes active refresh token', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const service = new LogoutAuthHandler(refreshTokenRepository);
      const stored = createRefreshToken();

      refreshTokenRepository.findByTokenHash.mockResolvedValue(stored);

      await expect(
        service.execute(new LogoutAuthCommand('refresh-token')),
      ).resolves.toEqual({
        success: true,
      });
      expect(stored.revoked_at).toBeInstanceOf(Date);
      expect(refreshTokenRepository.save).toHaveBeenCalledWith(stored);
    });

    it('does not persist a token that is already revoked', async () => {
      const refreshTokenRepository = createRefreshTokenRepositoryMock();
      const service = new LogoutAuthHandler(refreshTokenRepository);
      const stored = createRefreshToken({ revoked_at: new Date() });

      refreshTokenRepository.findByTokenHash.mockResolvedValue(stored);

      await expect(
        service.execute(new LogoutAuthCommand('refresh-token')),
      ).resolves.toEqual({ success: true });
      expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('GetProfileAuthHandler', () => {
    it('returns active user profile', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new GetProfileAuthHandler(userRepository);
      const user = createUser();

      userRepository.findProfileById.mockResolvedValue(user);

      await expect(
        service.execute(
          new GetProfileAuthQuery({
            sub: user.id,
            id: user.id,
            email: user.email,
            username: user.username,
            systemRole: user.systemRole,
          }),
        ),
      ).resolves.toBe(user);
    });

    it('throws when user is not found', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new GetProfileAuthHandler(userRepository);

      userRepository.findProfileById.mockResolvedValue(null);

      await expect(
        service.execute(
          new GetProfileAuthQuery({
            sub: 'user-1',
            id: 'user-1',
            email: 'user@example.com',
            username: 'user',
            systemRole: SystemRole.USER,
          }),
        ),
      ).rejects.toMatchObject({
        response: {
          code: ErrorCode.USER_NOT_FOUND,
        },
        status: HttpStatus.NOT_FOUND,
      });
    });

    it('rejects an inactive profile', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new GetProfileAuthHandler(userRepository);
      const user = createUser({ isActive: false });

      userRepository.findProfileById.mockResolvedValue(user);

      await expect(
        service.execute(
          new GetProfileAuthQuery({
            sub: user.id,
            id: user.id,
            email: user.email,
            username: user.username,
            systemRole: user.systemRole,
          }),
        ),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INACTIVE },
        status: HttpStatus.UNAUTHORIZED,
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

    it('returns null when the password is invalid', async () => {
      const userRepository = createUserRepositoryMock();
      const service = new ValidateUserAuthServiceImpl(userRepository);
      const user = createUser();

      userRepository.findByEmail.mockResolvedValue(user);
      jest.spyOn(service, 'comparePassword').mockReturnValue(false);

      await expect(
        service.validateUser(user.email, 'wrong-password'),
      ).resolves.toBeNull();
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

  describe('GoogleAuthHandler', () => {
    it('creates user and default workspace when google user is new', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const createWorkspaceHandler = createWorkspaceHandlerMock();
      const service = new GoogleAuthHandler(
        userRepository,
        issueTokenService,
        createWorkspaceHandler,
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
        service.execute(
          new GoogleAuthCommand({
            googleId: 'google-1',
            email: user.email,
            avatarUrl: user.avatarUrl ?? undefined,
          }),
        ),
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
      expect(createWorkspaceHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
        }),
      );
    });

    it('links an existing email account without creating a workspace', async () => {
      const userRepository = createUserRepositoryMock();
      const issueTokenService = createIssueTokenServiceMock();
      const createWorkspaceHandler = createWorkspaceHandlerMock();
      const service = new GoogleAuthHandler(
        userRepository,
        issueTokenService,
        createWorkspaceHandler,
      );
      const existingUser = createUser({ googleId: null, avatarUrl: null });
      const linkedUser = createUser({
        googleId: 'google-1',
        avatarUrl: 'https://example.com/avatar.png',
      });

      userRepository.findByGoogleId.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(existingUser);
      userRepository.save.mockResolvedValue(linkedUser);
      issueTokenService.issueTokens.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });

      await service.execute(
        new GoogleAuthCommand({
          googleId: 'google-1',
          email: existingUser.email,
          avatarUrl: 'https://example.com/avatar.png',
        }),
      );

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          googleId: 'google-1',
          avatarUrl: 'https://example.com/avatar.png',
        }),
      );
      expect(userRepository.createGoogleUser).not.toHaveBeenCalled();
      expect(createWorkspaceHandler.execute).not.toHaveBeenCalled();
      expect(issueTokenService.issueTokens).toHaveBeenCalledWith(linkedUser);
    });
  });
});
