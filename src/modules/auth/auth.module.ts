import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleStrategy } from 'src/common/strategy/google.strategy';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { LocalStrategy } from 'src/common/strategy/local.strategy';
import { MailModule } from '../mail/mail.module';
import { RefreshToken } from '../refresh_token/entities/refresh_token.entity';
import { User } from '../users/domain/entities/user.entity';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { GetProfileAuthApplicationImpl } from './applications/get-profile-auth.application';
import { GoogleAuthApplicationImpl } from './applications/google-auth.application';
import { LoginAuthApplicationImpl } from './applications/login-auth.application';
import { LogoutAuthApplicationImpl } from './applications/logout-auth.application';
import { RefreshAuthApplicationImpl } from './applications/refresh-auth.application';
import { RegisterAuthApplicationImpl } from './applications/register-auth.application';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_TYPES } from './interfaces/types';
import { AuthRefreshTokenRepositoryImpl } from './repositories/auth-refresh-token.repository';
import { AuthUserRepositoryImpl } from './repositories/auth-user.repository';
import { AuthGoogleService } from './services/auth-google.service';
import { GetProfileAuthServiceImpl } from './services/get-profile-auth.service';
import { GoogleAuthServiceImpl } from './services/google-auth.service';
import { IssueAuthTokenServiceImpl } from './services/issue-auth-token.service';
import { LoginAuthServiceImpl } from './services/login-auth.service';
import { LogoutAuthServiceImpl } from './services/logout-auth.service';
import { RefreshAuthServiceImpl } from './services/refresh-auth.service';
import { RegisterAuthServiceImpl } from './services/register-auth.service';
import { ValidateUserAuthServiceImpl } from './services/validate-user-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Workspace]),
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
    WorkspacesModule,
    MailModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    AuthGoogleService,
    GoogleStrategy,
    {
      provide: AUTH_TYPES.repositories.AuthUserRepository,
      useClass: AuthUserRepositoryImpl,
    },
    {
      provide: AUTH_TYPES.repositories.AuthRefreshTokenRepository,
      useClass: AuthRefreshTokenRepositoryImpl,
    },
    {
      provide: AUTH_TYPES.services.IssueAuthTokenService,
      useClass: IssueAuthTokenServiceImpl,
    },
    {
      provide: AUTH_TYPES.services.RegisterAuthService,
      useClass: RegisterAuthServiceImpl,
    },
    {
      provide: AUTH_TYPES.services.LoginAuthService,
      useClass: LoginAuthServiceImpl,
    },
    {
      provide: AUTH_TYPES.services.RefreshAuthService,
      useClass: RefreshAuthServiceImpl,
    },
    {
      provide: AUTH_TYPES.services.LogoutAuthService,
      useClass: LogoutAuthServiceImpl,
    },
    {
      provide: AUTH_TYPES.services.ValidateUserAuthService,
      useClass: ValidateUserAuthServiceImpl,
    },
    {
      provide: AUTH_TYPES.services.GetProfileAuthService,
      useClass: GetProfileAuthServiceImpl,
    },
    {
      provide: AUTH_TYPES.services.GoogleAuthService,
      useClass: GoogleAuthServiceImpl,
    },
    {
      provide: AUTH_TYPES.applications.RegisterAuthApplication,
      useClass: RegisterAuthApplicationImpl,
    },
    {
      provide: AUTH_TYPES.applications.LoginAuthApplication,
      useClass: LoginAuthApplicationImpl,
    },
    {
      provide: AUTH_TYPES.applications.RefreshAuthApplication,
      useClass: RefreshAuthApplicationImpl,
    },
    {
      provide: AUTH_TYPES.applications.LogoutAuthApplication,
      useClass: LogoutAuthApplicationImpl,
    },
    {
      provide: AUTH_TYPES.applications.GetProfileAuthApplication,
      useClass: GetProfileAuthApplicationImpl,
    },
    {
      provide: AUTH_TYPES.applications.GoogleAuthApplication,
      useClass: GoogleAuthApplicationImpl,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
