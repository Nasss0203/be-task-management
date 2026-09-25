import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorCode } from 'src/common/constants/error-code.constant';
import { UserProfileAggregate } from 'src/modules/identity/domain/aggregates/user-profile/user-profile.aggregate';
import { UserAuthIdentityModel } from 'src/modules/identity/domain/aggregates/user-auth-identity/user-auth-identity.model';
import { UserAuthProvider } from 'src/modules/identity/domain/enums/user-auth-provider.enum';
import { type UserAuthIdentityRepository } from 'src/modules/identity/domain/repositories/user-auth-identity.repository';
import { type UserProfileRepository } from 'src/modules/identity/domain/repositories/user-profile.repository';
import {
  type UserRecord,
  type UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { CreateDefaultWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.command';
import { CreateDefaultWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-default-workspace/create-default-workspace.handler';
import { type PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { type UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { IssueAuthTokenServiceImpl } from '../../services/issue-auth-token.service';
import { GoogleAuthCommand } from './google-auth.command';
import { GOOGLE_OIDC_ISSUER } from './google-auth.constants';

export type GoogleAuthResult = {
  access_token: string;
  refresh_token: string;
  user: UserRecord;
};

@Injectable()
export class GoogleAuthHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(IDENTITY_TYPES.repositories.UserProfileRepository)
    private readonly userProfileRepository: UserProfileRepository,
    @Inject(IDENTITY_TYPES.repositories.UserAuthIdentityRepository)
    private readonly userAuthIdentityRepository: UserAuthIdentityRepository,

    private readonly issueAuthTokenService: IssueAuthTokenServiceImpl,
    private readonly createDefaultWorkspaceHandler: CreateDefaultWorkspaceHandler,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: GoogleAuthCommand): Promise<GoogleAuthResult> {
    const { googleUser } = command;
    const subject = googleUser.subject.trim();
    const normalizedEmail = this.normalizeEmail(googleUser.email);

    if (!subject) {
      throw new UnauthorizedException('Invalid Google identity');
    }

    const identity = await this.findGoogleIdentity(subject);

    if (identity) {
      return this.loginWithIdentity(
        identity,
        normalizedEmail,
        googleUser.emailVerified,
      );
    }

    if (!normalizedEmail || googleUser.emailVerified !== true) {
      throw new ForbiddenException(
        'Google account must have a verified email address',
      );
    }

    const emailOwner = await this.userRepository.findByEmail(normalizedEmail);
    if (emailOwner) {
      const racedIdentity = await this.findGoogleIdentity(subject);
      if (racedIdentity) {
        return this.loginWithIdentity(
          racedIdentity,
          normalizedEmail,
          googleUser.emailVerified,
        );
      }

      throw this.createEmailConflictException();
    }

    try {
      const provisioned = await this.uow.runInTransaction((context) =>
        this.provisionGoogleUser(
          subject,
          normalizedEmail,
          googleUser.avatarUrl ?? null,
          context,
        ),
      );

      if (provisioned.identity) {
        return this.loginWithIdentity(
          provisioned.identity,
          normalizedEmail,
          googleUser.emailVerified,
        );
      }

      return this.issueResult(provisioned.user);
    } catch (error: unknown) {
      const racedIdentity = await this.findGoogleIdentity(subject);
      if (racedIdentity) {
        return this.loginWithIdentity(
          racedIdentity,
          normalizedEmail,
          googleUser.emailVerified,
        );
      }

      const racedEmailOwner =
        await this.userRepository.findByEmail(normalizedEmail);
      if (racedEmailOwner) {
        throw this.createEmailConflictException();
      }

      throw error;
    }
  }

  private async findGoogleIdentity(
    subject: string,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel | null> {
    return this.userAuthIdentityRepository.findByProviderIdentity(
      {
        provider: UserAuthProvider.GOOGLE,
        issuer: GOOGLE_OIDC_ISSUER,
        providerSubject: subject,
        tenantId: null,
      },
      context,
    );
  }

  private async loginWithIdentity(
    identity: UserAuthIdentityModel,
    providerEmail: string | null,
    emailVerified: boolean,
  ): Promise<GoogleAuthResult> {
    const user = await this.userRepository.findById(identity.userId);
    this.assertActiveUser(user);

    const updatedIdentity =
      await this.userAuthIdentityRepository.updateLoginMetadata(identity.id, {
        providerEmail,
        emailVerified,
        tenantId: null,
        lastLoginAt: new Date(),
      });

    if (!updatedIdentity) {
      throw new UnauthorizedException('Unable to authenticate with Google');
    }

    return this.issueResult(user);
  }

  private async provisionGoogleUser(
    subject: string,
    email: string,
    avatarUrl: string | null,
    context: PersistenceContext,
  ): Promise<
    | { identity: UserAuthIdentityModel; user?: never }
    | { identity?: never; user: UserRecord }
  > {
    const existingIdentity = await this.findGoogleIdentity(subject, context);
    if (existingIdentity) {
      return { identity: existingIdentity };
    }

    const emailOwner = await this.userRepository.findByEmail(email, context);
    if (emailOwner) {
      throw this.createEmailConflictException();
    }

    const createdUser = await this.userRepository.createGoogleUser(
      {
        email,
        username: this.generateUsername(email),
        // Compatibility mirror only. Google login no longer reads users.google_id.
        googleId: subject,
        avatarUrl,
      },
      context,
    );

    const now = new Date();
    const profile = new UserProfileAggregate(
      crypto.randomUUID(),
      createdUser.id,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      now,
      now,
    );

    await this.userProfileRepository.save(profile, context);
    await this.createDefaultWorkspaceHandler.execute(
      new CreateDefaultWorkspaceCommand(createdUser.id),
    );

    await this.userAuthIdentityRepository.create(
      {
        userId: createdUser.id,
        provider: UserAuthProvider.GOOGLE,
        issuer: GOOGLE_OIDC_ISSUER,
        providerSubject: subject,
        providerEmail: email,
        emailVerified: true,
        tenantId: null,
        lastLoginAt: now,
      },
      context,
    );

    return { user: createdUser };
  }

  private assertActiveUser(
    user: UserRecord | null,
  ): asserts user is UserRecord {
    if (!user) {
      throw new UnauthorizedException('Unable to authenticate with Google');
    }

    if (user.isActive !== true) {
      throw new ForbiddenException({
        code: ErrorCode.USER_INACTIVE,
        message: 'User is inactive',
      });
    }
  }

  private async issueResult(user: UserRecord): Promise<GoogleAuthResult> {
    const tokens = await this.issueAuthTokenService.issueTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  private normalizeEmail(email: string | null): string | null {
    return email?.trim().toLowerCase() || null;
  }

  private createEmailConflictException(): ConflictException {
    return new ConflictException(
      'Email is already registered. Please sign in using your existing method.',
    );
  }

  private generateUsername(email: string): string {
    const base = email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || 'user';

    return `${base}_${Date.now()}`;
  }
}
