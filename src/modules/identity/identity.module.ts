import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleStrategy } from 'src/common/strategy/google.strategy';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { LocalStrategy } from 'src/common/strategy/local.strategy';
import { DatabaseModule } from 'src/database/database.module';
import { MailModule } from 'src/modules/mail/mail.module';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';
import { GoogleAuthHandler } from './application/commands/google-auth/google-auth.handler';
import { LoginAuthHandler } from './application/commands/login-auth/login-auth.handler';
import { LogoutAuthHandler } from './application/commands/logout-auth/logout-auth.handler';
import { RefreshAuthHandler } from './application/commands/refresh-auth/refresh-auth.handler';
import { RegisterAuthHandler } from './application/commands/register-auth/register-auth.handler';
import { GetProfileAuthHandler } from './application/queries/get-profile-auth/get-profile-auth.handler';
import { GetUserProfileHandler } from './application/queries/get-user-profile/get-user-profile.handler';
import { AuthService } from './application/services/auth.service';
import { FindUserServiceImpl } from './application/services/find-user.service';
import { IssueAuthTokenServiceImpl } from './application/services/issue-auth-token.service';
import { UserProfilePreferenceServiceImpl } from './application/services/user-profile-preference.service';
import { ValidateUserAuthServiceImpl } from './application/services/validate-user-auth.service';
import { IDENTITY_TYPES } from './identity.types';
import { RefreshToken } from './infrastructure/persistence/typeorm/entities/refresh-token.orm-entity';
import { UserProfile } from './infrastructure/persistence/typeorm/entities/user-profile.orm-entity';
import { User } from './infrastructure/persistence/typeorm/entities/user.orm-entity';
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository';
import { TypeOrmUserProfileRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user-profile.repository';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { AuthController } from './presentation/http/controllers/auth.controller';
import { RefreshTokenController } from './presentation/http/controllers/refresh-token.controller';
import { UserProfilesController } from './presentation/http/controllers/user-profiles.controller';
import { UsersController } from './presentation/http/controllers/users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<number>('JWT_ACCESS_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    forwardRef(() => WorkspaceModule),
    MailModule,
    DatabaseModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    UserProfilesController,
    RefreshTokenController,
  ],
  providers: [
    AuthService,
    GetProfileAuthHandler,
    GoogleAuthHandler,
    IssueAuthTokenServiceImpl,
    LoginAuthHandler,
    LogoutAuthHandler,
    RefreshAuthHandler,
    RegisterAuthHandler,
    GetUserProfileHandler,
    ValidateUserAuthServiceImpl,
    LocalStrategy,
    JwtStrategy,
    GoogleStrategy,
    // Repository
    {
      provide: IDENTITY_TYPES.repositories.UserRepository,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: IDENTITY_TYPES.repositories.RefreshTokenRepository,
      useClass: TypeOrmRefreshTokenRepository,
    },
    {
      provide: IDENTITY_TYPES.repositories.UserProfileRepository,
      useClass: TypeOrmUserProfileRepository,
    },
    //Service
    {
      provide: IDENTITY_TYPES.services.FindUserService,
      useClass: FindUserServiceImpl,
    },
    {
      provide: IDENTITY_TYPES.services.UserProfilePreferenceService,
      useClass: UserProfilePreferenceServiceImpl,
    },
  ],
  exports: [
    IDENTITY_TYPES.services.FindUserService,
    IDENTITY_TYPES.services.UserProfilePreferenceService,
  ],
})
export class IdentityModule {}
