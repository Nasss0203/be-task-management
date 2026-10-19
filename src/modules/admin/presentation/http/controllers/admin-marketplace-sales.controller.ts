import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { AdminRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminMarketplaceSalesRequestDto } from '../../../application/dto/request/list-admin-marketplace-sales.request.dto';
import { AdminMarketplaceSaleListResponseDto } from '../../../application/dto/response/admin-marketplace-sale-list.response.dto';
import { AdminMarketplaceSalesOverviewResponseDto } from '../../../application/dto/response/admin-marketplace-sales-overview.response.dto';
import { GetAdminMarketplaceSalesOverviewHandler } from '../../../application/queries/get-admin-marketplace-sales-overview/get-admin-marketplace-sales-overview.handler';
import { GetAdminMarketplaceSalesOverviewQuery } from '../../../application/queries/get-admin-marketplace-sales-overview/get-admin-marketplace-sales-overview.query';
import { ListAdminMarketplaceSalesHandler } from '../../../application/queries/list-admin-marketplace-sales/list-admin-marketplace-sales.handler';
import { ListAdminMarketplaceSalesQuery } from '../../../application/queries/list-admin-marketplace-sales/list-admin-marketplace-sales.query';
import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';

@Controller('admin/marketplace/sales')
@UseGuards(AdminPermissionGuard)
export class AdminMarketplaceSalesController {
  constructor(
    @Inject(ADMIN_TYPES.applications.GetAdminMarketplaceSalesOverviewHandler)
    private readonly getOverviewHandler: GetAdminMarketplaceSalesOverviewHandler,

    @Inject(ADMIN_TYPES.applications.ListAdminMarketplaceSalesHandler)
    private readonly listSalesHandler: ListAdminMarketplaceSalesHandler,
  ) {}

  @Get('overview')
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get marketplace sales overview successfully')
  getOverview(): Promise<AdminMarketplaceSalesOverviewResponseDto> {
    return this.getOverviewHandler.execute(
      new GetAdminMarketplaceSalesOverviewQuery(),
    );
  }

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get marketplace sales successfully')
  list(
    @Query() request: ListAdminMarketplaceSalesRequestDto,
  ): Promise<AdminMarketplaceSaleListResponseDto> {
    return this.listSalesHandler.execute(
      new ListAdminMarketplaceSalesQuery(
        request.page,
        request.limit,
        request.search,
      ),
    );
  }
}
