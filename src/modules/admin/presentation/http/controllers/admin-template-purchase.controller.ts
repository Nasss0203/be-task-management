import {
  Body,
  Controller,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';

import { Auth } from 'src/common/decorator/auth.decorator';
import { StrictWriteRateLimit } from 'src/common/decorator/rate-limit.decorator';
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
  ) {}

  @Post(':purchaseId/reconciliation')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.BILLING_UPDATE)
  @ResponseMessage('Template purchase reconciliation resolved')
  resolveReconciliation(
    @Param('purchaseId', ParseUUIDPipe) purchaseId: string,
    @Body() request: ResolveTemplatePurchaseReconciliationRequest,
    @Auth() actor: IUserJwtPayload,
  ): Promise<ResolveTemplatePurchaseReconciliationResult> {
    return this.resolveReconciliationHandler.execute(
      new ResolveTemplatePurchaseReconciliationCommand(
        purchaseId,
        request.resolution,
        actor.id,
      ),
    );
  }
}
