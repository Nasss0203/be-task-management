import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Auth } from 'src/common/decorator/auth.decorator';
import type { IUserJwtPayload } from 'src/modules/identity/identity-jwt.types';

import {
  AdminRateLimit,
  StrictWriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { SystemRole } from 'src/modules/identity/identity.types';

import { CreateTemplateCategoryCommand } from 'src/modules/marketplace/application/commands/template-category/create-template-category/create-template-category.command';

import { CreateTemplateCategoryHandler } from 'src/modules/marketplace/application/commands/template-category/create-template-category/create-template-category.handler';

import { TemplateCategoryResponseDto } from 'src/modules/marketplace/application/dto/template-category/template-category.response.dto';

import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';

import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';

import { ChangeTemplateCategoryStatusRequestDto } from 'src/modules/admin/application/dto/request/change-template-category-status.request.dto';
import { UpdateTemplateCategoryRequestDto } from 'src/modules/admin/application/dto/request/update-template-category.request.dto';
import { UpdateTemplateCategoryCommand } from 'src/modules/marketplace/application/commands/template-category/update-template-category/update-template-category.command';
import { UpdateTemplateCategoryHandler } from 'src/modules/marketplace/application/commands/template-category/update-template-category/update-template-category.handler';
import { ChangeTemplateCategoryStatusCommand } from 'src/modules/marketplace/application/queries/template-category/change-template-category-status/change-template-category-status.command';
import { ChangeTemplateCategoryStatusHandler } from 'src/modules/marketplace/application/queries/template-category/change-template-category-status/change-template-category-status.handler';
import { ListTemplateCategoriesHandler } from 'src/modules/marketplace/application/queries/template-category/list-template-categories/list-template-categories.handler';
import { ListTemplateCategoriesQuery } from 'src/modules/marketplace/application/queries/template-category/list-template-categories/list-template-categories.query';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import { ADMIN_TYPES } from '../../../admin.types';
import type { AdminActionRecorder } from '../../../application/ports/admin-action-recorder.port';
import { adminRequestClientOf } from '../admin-request-client';
import { CreateTemplateCategoryRequest } from '../template-category/create-template-category.request';

@Controller('admin/template-categories')
@UseGuards(AdminPermissionGuard)
export class AdminTemplateCategoryController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.CreateTemplateCategoryHandler)
    private readonly createTemplateCategoryHandler: CreateTemplateCategoryHandler,

    @Inject(MARKETPLACE_TYPES.applications.ListTemplateCategoriesHandler)
    private readonly listTemplateCategoriesHandler: ListTemplateCategoriesHandler,

    @Inject(MARKETPLACE_TYPES.applications.UpdateTemplateCategoryHandler)
    private readonly updateTemplateCategoryHandler: UpdateTemplateCategoryHandler,
    @Inject(MARKETPLACE_TYPES.applications.ChangeTemplateCategoryStatusHandler)
    private readonly changeTemplateCategoryStatusHandler: ChangeTemplateCategoryStatusHandler,

    @Inject(ADMIN_TYPES.ports.ActionRecorder)
    private readonly actionRecorder: AdminActionRecorder,
  ) {}

  @Post()
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATE_CATEGORIES_CREATE)
  @ResponseMessage('Create template category successfully')
  async create(
    @Body() dto: CreateTemplateCategoryRequest,
    @Auth() actor: IUserJwtPayload,
    @Req() req: Request,
  ): Promise<TemplateCategoryResponseDto> {
    const category = await this.createTemplateCategoryHandler.execute(
      new CreateTemplateCategoryCommand(
        dto.name,
        dto.slug,
        dto.description,
        dto.sort_order,
      ),
    );

    await this.actionRecorder.record({
      actor: { userId: actor.id, ...adminRequestClientOf(req) },
      action: 'TEMPLATE_CATEGORY_CREATED',
      targetType: 'TEMPLATE_CATEGORY',
      targetId: category.id,
      changes: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        sortOrder: dto.sort_order,
      },
    });

    return category;
  }

  @Get()
  @AdminRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATE_CATEGORIES_READ)
  @ResponseMessage('Get template categories successfully')
  list(): Promise<TemplateCategoryResponseDto[]> {
    return this.listTemplateCategoriesHandler.execute(
      new ListTemplateCategoriesQuery(),
    );
  }

  @Patch(':categoryId')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATE_CATEGORIES_UPDATE)
  @ResponseMessage('Update template category successfully')
  async updateCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateTemplateCategoryRequestDto,
    @Auth() actor: IUserJwtPayload,
    @Req() req: Request,
  ): Promise<TemplateCategoryResponseDto> {
    const category = await this.updateTemplateCategoryHandler.execute(
      new UpdateTemplateCategoryCommand(
        categoryId,
        dto.name,
        dto.slug,
        dto.description,
        dto.sort_order,
      ),
    );

    await this.actionRecorder.record({
      actor: { userId: actor.id, ...adminRequestClientOf(req) },
      action: 'TEMPLATE_CATEGORY_UPDATED',
      targetType: 'TEMPLATE_CATEGORY',
      targetId: categoryId,
      changes: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        sortOrder: dto.sort_order,
      },
    });

    return category;
  }

  @Patch(':categoryId/status')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATE_CATEGORIES_UPDATE)
  @ResponseMessage('Template category status updated successfully')
  async changeStatus(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: ChangeTemplateCategoryStatusRequestDto,
    @Auth() actor: IUserJwtPayload,
    @Req() req: Request,
  ): Promise<TemplateCategoryResponseDto> {
    const category = await this.changeTemplateCategoryStatusHandler.execute(
      new ChangeTemplateCategoryStatusCommand(categoryId, dto.is_active),
    );

    await this.actionRecorder.record({
      actor: { userId: actor.id, ...adminRequestClientOf(req) },
      action: 'TEMPLATE_CATEGORY_STATUS_CHANGED',
      targetType: 'TEMPLATE_CATEGORY',
      targetId: categoryId,
      changes: { isActive: { to: dto.is_active } },
    });

    return category;
  }
}
