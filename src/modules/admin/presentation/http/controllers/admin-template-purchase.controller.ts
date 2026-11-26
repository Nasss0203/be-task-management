import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsEnum } from 'class-validator';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  AdminRateLimit,
  StrictWriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import {
  ResolveTemplatePurchaseReconciliationCommand,
  TemplatePurchaseReconciliationResolution,
} from 'src/modules/marketplace/application/commands/template-purchase/resolve-template-purchase-reconciliation/resolve-template-purchase-reconciliation.command';
import {
  ResolveTemplatePurchaseReconciliationHandler,
  ResolveTemplatePurchaseReconciliationResult,
} from 'src/modules/marketplace/application/commands/template-purchase/resolve-template-purchase-reconciliation/resolve-template-purchase-reconciliation.handler';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';
import { SystemRole } from 'src/modules/identity/identity.types';

import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';
import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import { ADMIN_TYPES } from '../../../admin.types';
import { ListAdminReconciliationPurchasesRequestDto } from '../../../application/dto/request/list-admin-reconciliation-purchases.request.dto';
import { AdminReconciliationPurchaseListResponseDto } from '../../../application/dto/response/admin-reconciliation-purchase-list.response.dto';
import type { AdminActionRecorder } from '../../../application/ports/admin-action-recorder.port';
import { ListAdminReconciliationPurchasesHandler } from '../../../application/queries/list-admin-reconciliation-purchases/list-admin-reconciliation-purchases.handler';
import { ListAdminReconciliationPurchasesQuery } from '../../../application/queries/list-admin-reconciliation-purchases/list-admin-reconciliation-purchases.query';
import { adminRequestClientOf } from '../admin-request-client';

export class ResolveTemplatePurchaseReconciliationRequest {
  @IsEnum(TemplatePurchaseReconciliationResolution)
  resolution: TemplatePurchaseReconciliationResolution;
}

@Controller('admin/marketplace/purchases')
@UseGuards(AdminPermissionGuard)
export class AdminTemplatePurchaseController {
  constructor(
    @Inject(
      MARKETPLACE_TYPES.applications
        .ResolveTemplatePurchaseReconciliationHandler,
    )
    private readonly resolveReconciliationHandler: ResolveTemplatePurchaseReconciliationHandler,

    @Inject(ADMIN_TYPES.ports.ActionRecorder)
    private readonly actionRecorder: AdminActionRecorder,

    @Inject(ADMIN_TYPES.applications.ListAdminReconciliationPurchasesHandler)
    private readonly listReconciliationHandler: ListAdminReconciliationPurchasesHandler,
  ) {}

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_READ)
  @ResponseMessage('Get purchases to reconcile successfully')
  list(
    @Query() request: ListAdminReconciliationPurchasesRequestDto,
  ): Promise<AdminReconciliationPurchaseListResponseDto> {
    return this.listReconciliationHandler.execute(
      new ListAdminReconciliationPurchasesQuery(
        request.page,
        request.limit,
        request.status,
        request.search,
      ),
    );
  }

  @Post(':purchaseId/reconciliation')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_UPDATE)
  @ResponseMessage('Template purchase reconciliation resolved')
  async resolveReconciliation(
    @Param('purchaseId', ParseUUIDPipe) purchaseId: string,
    @Body() request: ResolveTemplatePurchaseReconciliationRequest,
    @Auth() actor: IUserJwtPayload,
    @Req() req: Request,
  ): Promise<ResolveTemplatePurchaseReconciliationResult> {
    const result = await this.resolveReconciliationHandler.execute(
      new ResolveTemplatePurchaseReconciliationCommand(
        purchaseId,
        request.resolution,
        actor.id,
      ),
    );

    await this.actionRecorder.record({
      actor: { userId: actor.id, ...adminRequestClientOf(req) },
      action: 'TEMPLATE_PURCHASE_RECONCILED',
      targetType: 'TEMPLATE_PURCHASE',
      targetId: result.purchaseId,
      changes: {
        resolution: request.resolution,
        status: result.status,
        entitlementId: result.entitlementId,
      },
    });

    return result;
  }
}
