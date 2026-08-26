export const IDENTITY_TYPES = {
  repositories: {
    UserRepository: Symbol('IdentityUserRepository'),
    RefreshTokenRepository: Symbol('IdentityRefreshTokenRepository'),
    UserProfileRepository: Symbol('UserProfileRepository'),
  },
  services: {
    FindUserService: Symbol('IdentityFindUserService'),
    UserProfilePreferenceService: Symbol('UserProfilePreferenceService'),
  },
};

// Public identity contracts used by shared guards and other bounded contexts.
export { SystemRole } from './domain/enums/system-role.enum';
export { User } from './infrastructure/persistence/typeorm/entities/user.orm-entity';
