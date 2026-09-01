import { Module } from '@nestjs/common';
import { ADMIN_TYPES } from './admin.types';
import { GetAdminAccessHandler } from './application/queries/get-admin-access/get-admin-access.handler';
import { AdminAuthorizationService } from './application/services/admin-authorization.service';
import { AdminAccessController } from './presentation/http/controllers/admin-access.controller';
import { AdminPermissionGuard } from './presentation/http/guards/admin-permission.guard';

@Module({
  controllers: [AdminAccessController],
  providers: [
    {
      provide: ADMIN_TYPES.applications.GetAdminAccessHandler,
      useClass: GetAdminAccessHandler,
    },
    {
      provide: ADMIN_TYPES.services.AdminAuthorizationService,
      useClass: AdminAuthorizationService,
    },
    AdminPermissionGuard,
  ],
})
export class AdminModule {}
