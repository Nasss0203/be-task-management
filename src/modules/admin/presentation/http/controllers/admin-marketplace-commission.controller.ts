import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common';

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
  update(
    @Body() dto: UpdateMarketplaceCommissionRateRequestDto,
    @Auth() actor: IUserJwtPayload,
  ): Promise<MarketplaceCommissionRateResponseDto> {
    return this.updateCommissionRateHandler.execute(
      new UpdateMarketplaceCommissionRateCommand(dto.rateBps, actor.id),
    );
  }
}
