import {
  Body,
  Controller,
  Get,
  Inject,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  AdminRateLimit,
  StrictWriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { UpdateMarketplaceCommissionRateRequestDto } from 'src/modules/admin/application/dto/request/update-marketplace-commission-rate.request.dto';
import type { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';
import { SystemRole } from 'src/modules/identity/identity.types';
import { UpdateMarketplaceCommissionRateCommand } from 'src/modules/marketplace/application/commands/marketplace-commission/update-marketplace-commission-rate/update-marketplace-commission-rate.command';
import { UpdateMarketplaceCommissionRateHandler } from 'src/modules/marketplace/application/commands/marketplace-commission/update-marketplace-commission-rate/update-marketplace-commission-rate.handler';
import {
  MarketplaceCommissionRateResponseDto,
  MarketplaceCommissionSettingsResponseDto,
} from 'src/modules/marketplace/application/dto/marketplace-commission/marketplace-commission-rate.response.dto';
import { GetMarketplaceCommissionRateHandler } from 'src/modules/marketplace/application/queries/marketplace-commission/get-marketplace-commission-rate/get-marketplace-commission-rate.handler';
import { GetMarketplaceCommissionRateQuery } from 'src/modules/marketplace/application/queries/marketplace-commission/get-marketplace-commission-rate/get-marketplace-commission-rate.query';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import { ADMIN_TYPES } from '../../../admin.types';
import type { AdminActionRecorder } from '../../../application/ports/admin-action-recorder.port';
import { adminRequestClientOf } from '../admin-request-client';

@Controller('admin/marketplace/commission-rate')
@UseGuards(AdminPermissionGuard)
export class AdminMarketplaceCommissionController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.GetMarketplaceCommissionRateHandler)
    private readonly getCommissionRateHandler: GetMarketplaceCommissionRateHandler,

    @Inject(
      MARKETPLACE_TYPES.applications.UpdateMarketplaceCommissionRateHandler,
    )
    private readonly updateCommissionRateHandler: UpdateMarketplaceCommissionRateHandler,

    @Inject(ADMIN_TYPES.ports.ActionRecorder)
    private readonly actionRecorder: AdminActionRecorder,
  ) {}

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get marketplace commission rate successfully')
  get(): Promise<MarketplaceCommissionSettingsResponseDto> {
    return this.getCommissionRateHandler.execute(
      new GetMarketplaceCommissionRateQuery(),
    );
  }

  @Put()
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_UPDATE)
  @ResponseMessage('Update marketplace commission rate successfully')
  async update(
    @Body() dto: UpdateMarketplaceCommissionRateRequestDto,
    @Auth() actor: IUserJwtPayload,
    @Req() req: Request,
  ): Promise<MarketplaceCommissionRateResponseDto> {
    const rate = await this.updateCommissionRateHandler.execute(
      new UpdateMarketplaceCommissionRateCommand(dto.rateBps, actor.id),
    );

    await this.actionRecorder.record({
      actor: { userId: actor.id, ...adminRequestClientOf(req) },
      action: 'MARKETPLACE_COMMISSION_UPDATED',
      targetType: 'MARKETPLACE_COMMISSION',
      targetId: null,
      changes: { rateBps: { to: rate.rateBps } },
    });

    return rate;
  }
}
