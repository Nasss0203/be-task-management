export const IDENTITY_TYPES = {
  repositories: {
    UserRepository: Symbol('IdentityUserRepository'),
    RefreshTokenRepository: Symbol('IdentityRefreshTokenRepository'),
  },
  services: {
    FindUserService: Symbol('IdentityFindUserService'),
  },
};

// Public identity contracts used by shared guards and other bounded contexts.
export { SystemRole } from './domain/enums/system-role.enum';
export { User } from './infrastructure/persistence/typeorm/entities/user.orm-entity';
