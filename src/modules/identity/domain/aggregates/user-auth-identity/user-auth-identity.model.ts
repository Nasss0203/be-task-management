import { UserAuthProvider } from '../../enums/user-auth-provider.enum';

export class UserAuthIdentityModel {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly provider: UserAuthProvider,
    public readonly issuer: string,
    public readonly providerSubject: string,
    public readonly providerEmail: string | null,
    public readonly emailVerified: boolean,
    public readonly tenantId: string | null,
    public readonly lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
