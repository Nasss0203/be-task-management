import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { UserAuthIdentityModel } from '../aggregates/user-auth-identity/user-auth-identity.model';
import { UserAuthProvider } from '../enums/user-auth-provider.enum';

export interface CreateUserAuthIdentityInput {
  userId: string;
  provider: UserAuthProvider;
  issuer: string;
  providerSubject: string;
  providerEmail: string | null;
  emailVerified: boolean;
  tenantId: string | null;
  lastLoginAt: Date | null;
}

export interface UpdateUserAuthIdentityLoginMetadataInput {
  providerEmail: string | null;
  emailVerified: boolean;
  tenantId: string | null;
  lastLoginAt: Date | null;
}

export interface UserAuthIdentityKey {
  provider: UserAuthProvider;
  issuer: string;
  providerSubject: string;
  tenantId: string | null;
}

export interface UserAuthIdentityRepository {
  findByProviderIdentity(
    key: UserAuthIdentityKey,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel | null>;
  findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel[]>;
  create(
    input: CreateUserAuthIdentityInput,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel>;
  updateLoginMetadata(
    identityId: string,
    input: UpdateUserAuthIdentityLoginMetadataInput,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel | null>;
}
