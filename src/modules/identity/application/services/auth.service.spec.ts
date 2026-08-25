import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { MailService } from 'src/modules/mail/mail.service';
import { HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { IssueAuthTokenServiceImpl } from './issue-auth-token.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findByEmailVerificationToken: jest.fn(),
    save: jest.fn(),
  };

  const mockIssueAuthTokenService = {
    issueTokens: jest.fn(),
  };

  const mockMailService = {
    sendVerificationEmail: jest.fn(),
    sendResetPasswordEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: IDENTITY_TYPES.repositories.UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: IssueAuthTokenServiceImpl,
          useValue: mockIssueAuthTokenService,
        },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyEmail', () => {
    const token = 'some-token';
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    it('should verify email and issue tokens when user is active and token is valid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        username: 'test',
        isEmailVerified: false,
        isActive: true,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 60_000),
      };

      mockUserRepository.findByEmailVerificationToken.mockResolvedValue(
        mockUser,
      );
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockIssueAuthTokenService.issueTokens.mockResolvedValue({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      });

      const result = await service.verifyEmail(token);

      expect(
        mockUserRepository.findByEmailVerificationToken,
      ).toHaveBeenCalledWith(hashedToken);
      expect(mockUser.isEmailVerified).toBe(true);
      expect(mockUser.emailVerificationToken).toBeNull();
      expect(mockUser.emailVerificationExpires).toBeNull();
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(mockIssueAuthTokenService.issueTokens).toHaveBeenCalledWith(
        mockUser,
      );
      expect(result).toEqual({
        success: true,
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      });
    });

    it('should throw BadRequestException when token is invalid', async () => {
      mockUserRepository.findByEmailVerificationToken.mockResolvedValue(null);

      await expect(service.verifyEmail(token)).rejects.toMatchObject({
        response: {
          code: ErrorCode.INVALID_VERIFICATION_TOKEN,
        },
        status: HttpStatus.BAD_REQUEST,
      });
      expect(mockIssueAuthTokenService.issueTokens).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is inactive', async () => {
      const mockUser = {
        id: 'user-1',
        isActive: false,
        emailVerificationToken: hashedToken,
      };

      mockUserRepository.findByEmailVerificationToken.mockResolvedValue(
        mockUser,
      );

      await expect(service.verifyEmail(token)).rejects.toMatchObject({
        response: {
          code: ErrorCode.USER_INACTIVE,
        },
        status: HttpStatus.FORBIDDEN,
      });
      expect(mockIssueAuthTokenService.issueTokens).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when token is expired', async () => {
      const mockUser = {
        id: 'user-1',
        isActive: true,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() - 60_000), // expired
      };

      mockUserRepository.findByEmailVerificationToken.mockResolvedValue(
        mockUser,
      );

      await expect(service.verifyEmail(token)).rejects.toMatchObject({
        response: {
          code: ErrorCode.EMAIL_VERIFICATION_EXPIRED,
        },
        status: HttpStatus.BAD_REQUEST,
      });
      expect(mockIssueAuthTokenService.issueTokens).not.toHaveBeenCalled();
    });
  });
});
