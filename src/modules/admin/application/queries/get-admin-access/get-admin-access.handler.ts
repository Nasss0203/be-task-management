import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_TYPES } from '../../../admin.types';
import { AdminAccessResponseDto } from '../../dto/response/admin-access.response.dto';
import { AdminAuthorizationService } from '../../services/admin-authorization.service';
import { AdminActor } from '../../../domain/value-objects/admin-actor.vo';
import { GetAdminAccessQuery } from './get-admin-access.query';

@Injectable()
export class GetAdminAccessHandler {
  constructor(
    @Inject(ADMIN_TYPES.services.AdminAuthorizationService)
    private readonly adminAuthorizationService: AdminAuthorizationService,
  ) {}

  execute(query: GetAdminAccessQuery): AdminAccessResponseDto {
    const actor = new AdminActor({
      userId: query.userId,
      systemRole: query.systemRole,
    });

    return {
      userId: actor.userId,
      systemRole: actor.systemRole,
      permissions: this.adminAuthorizationService.getPermissions(actor),
    };
  }
}
