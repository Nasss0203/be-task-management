import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RefreshTokenModule } from './modules/refresh_token/refresh_token.module';
import { RoleModule } from './modules/role/role.module';
import { RolePermissionModule } from './modules/role_permission/role_permission.module';
import { RbacSeedService } from './modules/seed/rbac.seed.service';
import { SeedsModule } from './modules/seed/seeds.module';
import { UserProfilesModule } from './modules/user_profiles/user_profiles.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspaceMembersModule } from './modules/workspace_members/workspace_members.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    SeedsModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    RoleModule,
    PermissionModule,
    RolePermissionModule,
    RefreshTokenModule,
    UserProfilesModule,
    WorkspaceMembersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RbacSeedService,
    AppService,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
