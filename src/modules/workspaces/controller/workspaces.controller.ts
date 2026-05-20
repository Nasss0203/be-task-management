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
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { WorkspaceOverviewResponseDto } from '../dto/response/workspace-overview.response.dto';
import { type AccessWorkspaceApplication } from '../interfaces/applications/access-workspace.application.interface';
import type { CreateWorkspaceTemplateDto } from '../interfaces/applications/create-workspace-template.application.interface';
import { type CreateWorkspaceTemplateApplication } from '../interfaces/applications/create-workspace-template.application.interface';
import { type CreateWorkspaceApplication } from '../interfaces/applications/create-workspace.application.interface';
import { type FindWorkspaceOverviewApplication } from '../interfaces/applications/find-workspace-overview.application.interface';
import { type FindWorkspaceApplication } from '../interfaces/applications/find.workspace.application.interface';
import { type WorkspaceTrashApplication } from '../interfaces/applications/workspace-trash.application.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Controller('workspaces')
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
  ) {}

  @Post('default')
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

  @Delete(':workspaceId')
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
}
