import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/modules/identity/domain/repositories/user.repository';
import {
  SystemRole,
  User,
} from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-access-token-secret'),
    } as unknown as ConfigService;

    userRepository = {
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      findByEmailOrUsername: jest.fn(),
      findByEmailAndUsername: jest.fn(),
      findByEmailVerificationToken: jest.fn(),
      findByResetPasswordToken: jest.fn(),
      findProfileById: jest.fn(),
      createLocalUser: jest.fn(),
      createGoogleUser: jest.fn(),
      save: jest.fn(),
    };

    strategy = new JwtStrategy(configService, userRepository);
  });

  it('loads the current active user by only the token subject', async () => {
    userRepository.findProfileById.mockResolvedValue({
      id: 'target-user',
      email: 'target@example.com',
      username: 'target',
      systemRole: SystemRole.SYSTEM_ADMIN,
      isActive: true,
    } as User);

    await expect(
      strategy.validate({
        id: 'target-user',
        email: 'stale@example.com',
        username: 'stale',
        systemRole: SystemRole.USER,
      }),
    ).resolves.toEqual({
      id: 'target-user',
      email: 'target@example.com',
      username: 'target',
      systemRole: SystemRole.SYSTEM_ADMIN,
    });

    expect(userRepository.findProfileById).toHaveBeenCalledWith('target-user');
  });

  it('rejects an access token immediately after its user is locked', async () => {
    userRepository.findProfileById.mockResolvedValue({
      id: 'locked-user',
      isActive: false,
    } as User);

    await expect(
      strategy.validate({
        id: 'locked-user',
        email: 'locked@example.com',
        username: 'locked',
        systemRole: SystemRole.SYSTEM_ADMIN,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
