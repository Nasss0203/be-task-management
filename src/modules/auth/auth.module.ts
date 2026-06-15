import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { LocalStrategy } from 'src/common/strategy/local.strategy';
import { RefreshToken } from '../refresh_token/entities/refresh_token.entity';
import { User } from '../users/domain/entities/user.entity';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGoogleService } from './services/auth-google.service';
import { GoogleStrategy } from 'src/common/strategy/google.strategy';
import { UserActivityModule } from '../user_activity/user_activity.module';

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
    UserActivityModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    AuthGoogleService,
    GoogleStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
