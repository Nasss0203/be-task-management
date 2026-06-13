import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  StrictWriteRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { WorkspaceOverviewResponseDto } from '../dto/response/workspace-overview.response.dto';
import { UpdateWorkspaceDto } from '../dto/update-workspace.dto';
import { UpdateWorkspaceLayoutModeDto } from '../dto/update-workspace-layout-mode.dto';
import { SaveWorkspaceAsTemplateDto } from '../dto/save-workspace-template.dto';
import { type AccessWorkspaceApplication } from '../interfaces/applications/access-workspace.application.interface';
import { type SaveWorkspaceAsTemplateApplication } from '../interfaces/applications/save-workspace-as-template.application.interface';
import type { CreateWorkspaceTemplateDto } from '../interfaces/applications/create-workspace-template.application.interface';
import { type CreateWorkspaceTemplateApplication } from '../interfaces/applications/create-workspace-template.application.interface';
import { type CreateWorkspaceApplication } from '../interfaces/applications/create-workspace.application.interface';
import { type FindWorkspaceOverviewApplication } from '../interfaces/applications/find-workspace-overview.application.interface';
import { type FindWorkspaceApplication } from '../interfaces/applications/find.workspace.application.interface';
import { type UpdateWorkspaceApplication } from '../interfaces/applications/update-workspace.application.interface';
import { type UpdateWorkspaceLayoutModeApplication } from '../interfaces/applications/update-workspace-layout-mode.application.interface';
import { type WorkspaceTrashApplication } from '../interfaces/applications/workspace-trash.application.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';

@Controller('workspaces')
@ReadRateLimit()
export class WorkspacesController {
  constructor(
    @Inject(WORKSPACE_TYPES.applications.CreateWorkspaceApplication)
    private readonly createWorkspaceMultiServiceAppImpl: CreateWorkspaceApplication,

    @Inject(WORKSPACE_TYPES.applications.CreateWorkspaceTemplateApplication)
    private readonly createWorkspaceTemplateApplication: CreateWorkspaceTemplateApplication,

    @Inject(WORKSPACE_TYPES.applications.FindWorkspaceApplication)
    private readonly findWorkspaceApplicationImpl: FindWorkspaceApplication,

    @Inject(WORKSPACE_TYPES.applications.AccessWorkspaceApplication)
    private readonly accessWorkspaceApplication: AccessWorkspaceApplication,

    @Inject(WORKSPACE_TYPES.applications.WorkspaceTrashApplication)
    private readonly workspaceTrashApplication: WorkspaceTrashApplication,

    @Inject(WORKSPACE_TYPES.applications.FindWorkspaceOverviewApplication)
    private readonly findWorkspaceOverviewApplication: FindWorkspaceOverviewApplication,

    @Inject(WORKSPACE_TYPES.applications.UpdateWorkspaceApplication)
    private readonly updateWorkspaceApplication: UpdateWorkspaceApplication,

    @Inject(WORKSPACE_TYPES.applications.UpdateWorkspaceLayoutModeApplication)
    private readonly updateWorkspaceLayoutModeApplication: UpdateWorkspaceLayoutModeApplication,

    @Inject(WORKSPACE_TYPES.applications.SaveWorkspaceAsTemplateApplication)
    private readonly saveWorkspaceAsTemplateApplication: SaveWorkspaceAsTemplateApplication,
  ) {}

  @Post('default')
  @StrictWriteRateLimit()
  @ResponseMessage('Workspaces created')
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Auth() auth: IAuth,
  ) {
    return await this.createWorkspaceMultiServiceAppImpl.createDeault({
      userId: auth.id,
      createWorkspaceDto,
    });
  }

  @Post()
  @StrictWriteRateLimit()
  @ResponseMessage('Create workspace template')
  async createByTemplate(
    @Body() createWorkspaceDto: CreateWorkspaceTemplateDto,
    @Auth() auth: IAuth,
  ) {
    return this.createWorkspaceTemplateApplication.create({
      userId: auth.id,
      createWorkspaceDto,
    });
  }

  @Get()
  @ResponseMessage('Find all workspace')
  async findAllWorkspace(@Auth() auth: IAuth) {
    return await this.findWorkspaceApplicationImpl.findAllByUserId(auth.id);
  }

  @Get('trash')
  @ResponseMessage('Find deleted workspaces')
  async findDeletedWorkspaces(@Auth() auth: IAuth) {
    return this.workspaceTrashApplication.findDeletedWorkspacesByUserId(
      auth.id,
    );
  }

  @Get(':workspaceId')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ResponseMessage('Find one workspace')
  findOneWorkspaceById(
    @Auth() auth: IAuth,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.findWorkspaceApplicationImpl.findOneWorkspaceById(
      auth.id,
      workspaceId,
    );
  }

  @Get(':workspaceId/overview')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  findOverview(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceOverviewResponseDto> {
    return this.findWorkspaceOverviewApplication.findOverview(
      auth.id,
      workspaceId,
    );
  }

  @Get(':workspaceId/access')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ResponseMessage('Get access workspace')
  async getWorkspaceAccess(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    return this.accessWorkspaceApplication.getWorkspaceAccess(
      auth.id,
      workspaceId,
    );
  }

  @Patch(':workspaceId/layout-mode')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @ResponseMessage('Workspace layout mode updated')
  updateLayoutMode(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceLayoutModeDto,
    @Auth() auth: IAuth,
  ) {
    return this.updateWorkspaceLayoutModeApplication.updateLayoutMode({
      userId: auth.id,
      workspaceId,
      dto,
    });
  }

  @Post(':workspaceId/templates')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @ResponseMessage('Save workspace as template')
  async saveWorkspaceAsTemplate(
    @Auth() auth: IAuth,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SaveWorkspaceAsTemplateDto,
  ) {
    return this.saveWorkspaceAsTemplateApplication.save({
      userId: auth.id,
      workspaceId,
      dto,
    });
  }

  @Patch(':workspaceId')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_UPDATE)
  @ResponseMessage('Workspace updated')
  updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
    @Auth() auth: IAuth,
  ) {
    return this.updateWorkspaceApplication.update({
      userId: auth.id,
      workspaceId,
      dto,
    });
  }

  @Delete(':workspaceId')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_DELETE)
  @ResponseMessage('Workspace moved to trash')
  async softDeleteWorkspace(
    @Auth() auth: IAuth,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceTrashApplication.softDeleteWorkspace(
      auth.id,
      workspaceId,
    );
  }

  @Patch(':workspaceId/restore')
  @StrictWriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_DELETE)
  @ResponseMessage('Workspace restored')
  async restoreWorkspace(
    @Auth() auth: IAuth,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceTrashApplication.restoreWorkspace(
      auth.id,
      workspaceId,
    );
  }

  @Delete('trash/:workspaceId')
  @StrictWriteRateLimit()
  @ResponseMessage('Workspace removed from trash')
  async removeWorkspaceFromUserTrash(
    @Auth() auth: IAuth,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.workspaceTrashApplication.removeWorkspaceFromUserTrash(
      auth.id,
      workspaceId,
    );
  }
}
