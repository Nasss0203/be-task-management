import { UserAuthIdentityModel } from 'src/modules/identity/domain/aggregates/user-auth-identity/user-auth-identity.model';
import { UserAuthIdentityOrmEntity } from '../entities/user-auth-identity.orm-entity';

export class UserAuthIdentityMapper {
  static toModel(entity: UserAuthIdentityOrmEntity): UserAuthIdentityModel {
    return new UserAuthIdentityModel(
      entity.id,
      entity.userId,
      entity.provider,
      entity.issuer,
      entity.providerSubject,
      entity.providerEmail,
      entity.emailVerified,
      entity.tenantId,
      entity.lastLoginAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
