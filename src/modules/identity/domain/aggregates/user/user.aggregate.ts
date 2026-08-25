import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';

/**
 * Account-level identity state. Persistence concerns remain in UserOrmEntity;
 * this aggregate is the stable domain shape for future identity use cases.
 */
export class UserAggregate {
  constructor(
    public readonly id: string,
    public email: string,
    public username: string,
    public passwordHash: string | null,
    public isActive: boolean,
    public isEmailVerified: boolean,
    public systemRole: SystemRole,
    public googleId: string | null,
    public avatarUrl: string | null,
    public emailVerificationToken: string | null,
    public emailVerificationExpires: Date | null,
    public resetPasswordToken: string | null,
    public resetPasswordExpires: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public deletedAt: Date | null,
  ) {}

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  verifyEmail(): void {
    this.isEmailVerified = true;
    this.emailVerificationToken = null;
    this.emailVerificationExpires = null;
  }
}
