import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  AdminRateLimit,
  StrictWriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { SystemRole } from 'src/modules/identity/identity.types';

import { CreateTemplateCategoryCommand } from 'src/modules/template/application/commands/template-category/create-template-category/create-template-category.command';

import { CreateTemplateCategoryHandler } from 'src/modules/template/application/commands/template-category/create-template-category/create-template-category.handler';

import { TemplateCategoryResponseDto } from 'src/modules/template/application/dto/template-category/template-category.response.dto';

import { ADMIN_PERMISSIONS } from '../../../domain/permissions/admin-permission-code';

import { RequireAdminPermissions } from '../decorators/require-admin-permissions.decorator';

import { ChangeTemplateCategoryStatusRequestDto } from 'src/modules/admin/application/dto/request/change-template-category-status.request.dto';
import { UpdateTemplateCategoryRequestDto } from 'src/modules/admin/application/dto/request/update-template-category.request.dto';
import { UpdateTemplateCategoryCommand } from 'src/modules/template/application/commands/template-category/update-template-category/update-template-category.command';
import { UpdateTemplateCategoryHandler } from 'src/modules/template/application/commands/template-category/update-template-category/update-template-category.handler';
import { ChangeTemplateCategoryStatusCommand } from 'src/modules/template/application/queries/template-category/change-template-category-status/change-template-category-status.command';
import { ChangeTemplateCategoryStatusHandler } from 'src/modules/template/application/queries/template-category/change-template-category-status/change-template-category-status.handler';
import { ListTemplateCategoriesHandler } from 'src/modules/template/application/queries/template-category/list-template-categories/list-template-categories.handler';
import { ListTemplateCategoriesQuery } from 'src/modules/template/application/queries/template-category/list-template-categories/list-template-categories.query';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { AdminPermissionGuard } from '../guards/admin-permission.guard';
import { CreateTemplateCategoryRequest } from '../template-category/create-template-category.request';

@Controller('admin/template-categories')
@UseGuards(AdminPermissionGuard)
export class AdminTemplateCategoryController {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.CreateTemplateCategoryHandler)
    private readonly createTemplateCategoryHandler: CreateTemplateCategoryHandler,

    @Inject(TEMPLATE_TYPES.applications.ListTemplateCategoriesHandler)
    private readonly listTemplateCategoriesHandler: ListTemplateCategoriesHandler,

    @Inject(TEMPLATE_TYPES.applications.UpdateTemplateCategoryHandler)
    private readonly updateTemplateCategoryHandler: UpdateTemplateCategoryHandler,
    @Inject(TEMPLATE_TYPES.applications.ChangeTemplateCategoryStatusHandler)
    private readonly changeTemplateCategoryStatusHandler: ChangeTemplateCategoryStatusHandler,
  ) {}

  @Post()
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATE_CATEGORIES_CREATE)
  @ResponseMessage('Create template category successfully')
  async create(
    @Body() dto: CreateTemplateCategoryRequest,
  ): Promise<TemplateCategoryResponseDto> {
    return await this.createTemplateCategoryHandler.execute(
      new CreateTemplateCategoryCommand(
        dto.name,
        dto.slug,
        dto.description,
        dto.sort_order,
      ),
    );
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
  updateCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateTemplateCategoryRequestDto,
  ): Promise<TemplateCategoryResponseDto> {
    return this.updateTemplateCategoryHandler.execute(
      new UpdateTemplateCategoryCommand(
        categoryId,
        dto.name,
        dto.slug,
        dto.description,
        dto.sort_order,
      ),
    );
  }

  @Patch(':categoryId/status')
  @StrictWriteRateLimit()
  @RequireSystemRoles(SystemRole.SUPER_ADMIN)
  @RequireAdminPermissions(ADMIN_PERMISSIONS.TEMPLATE_CATEGORIES_UPDATE)
  @ResponseMessage('Template category status updated successfully')
  changeStatus(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: ChangeTemplateCategoryStatusRequestDto,
  ): Promise<TemplateCategoryResponseDto> {
    return this.changeTemplateCategoryStatusHandler.execute(
      new ChangeTemplateCategoryStatusCommand(categoryId, dto.is_active),
    );
  }
}
