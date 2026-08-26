import {
  Body,
  Controller,
  Delete,
  Get,
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
import { WorkspaceContext } from 'src/common/decorator/workspace-context.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';

import { WorkspaceOverviewResponseDto } from 'src/modules/workspace/application/dto/workspace/response/workspace-overview.response.dto';
import { UpdateWorkspaceLayoutModeDto } from 'src/modules/workspace/application/dto/workspace/update-workspace-layout-mode.dto';
import { UpdateWorkspaceDto } from 'src/modules/workspace/application/dto/workspace/update-workspace.dto';

import { RemoveWorkspaceFromTrashCommand } from 'src/modules/workspace/application/commands/workspace/remove-workspace-from-trash/remove-workspace-from-trash.command';
import { RemoveWorkspaceFromTrashHandler } from 'src/modules/workspace/application/commands/workspace/remove-workspace-from-trash/remove-workspace-from-trash.handler';
import { RestoreWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/restore-workspace/restore-workspace.command';
import { RestoreWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/restore-workspace/restore-workspace.handler';
import { SoftDeleteWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/soft-delete-workspace/soft-delete-workspace.command';
import { SoftDeleteWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/soft-delete-workspace/soft-delete-workspace.handler';
import { UpdateWorkspaceLayoutModeCommand } from 'src/modules/workspace/application/commands/workspace/update-workspace-layout-mode/update-workspace-layout-mode.command';
import { UpdateWorkspaceLayoutModeHandler } from 'src/modules/workspace/application/commands/workspace/update-workspace-layout-mode/update-workspace-layout-mode.handler';
import { UpdateWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/update-workspace/update-workspace.command';
import { UpdateWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/update-workspace/update-workspace.handler';
import { GetWorkspaceAccessHandler } from 'src/modules/workspace/application/queries/workspace/get-workspace-access/get-workspace-access.handler';
import { GetWorkspaceAccessQuery } from 'src/modules/workspace/application/queries/workspace/get-workspace-access/get-workspace-access.query';
import { GetWorkspaceOverviewHandler } from 'src/modules/workspace/application/queries/workspace/get-workspace-overview/get-workspace-overview.handler';
import { GetWorkspaceOverviewQuery } from 'src/modules/workspace/application/queries/workspace/get-workspace-overview/get-workspace-overview.query';
import { GetWorkspaceHandler } from 'src/modules/workspace/application/queries/workspace/get-workspace/get-workspace.handler';
import { GetWorkspaceQuery } from 'src/modules/workspace/application/queries/workspace/get-workspace/get-workspace.query';
import { ListDeletedWorkspacesHandler } from 'src/modules/workspace/application/queries/workspace/list-deleted-workspaces/list-deleted-workspaces.handler';
import { ListDeletedWorkspacesQuery } from 'src/modules/workspace/application/queries/workspace/list-deleted-workspaces/list-deleted-workspaces.query';
import { ListWorkspacesHandler } from 'src/modules/workspace/application/queries/workspace/list-workspaces/list-workspaces.handler';
import { ListWorkspacesQuery } from 'src/modules/workspace/application/queries/workspace/list-workspaces/list-workspaces.query';

import { CreateWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/create-workspace/create-workspace.command';
import { CreateWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/create-workspace/create-workspace.handler';
import { SelectWorkspaceCommand } from 'src/modules/workspace/application/commands/workspace/select-workspace/select-workspace.command';
import { SelectWorkspaceHandler } from 'src/modules/workspace/application/commands/workspace/select-workspace/select-workspace.handler';
import { CreateWorkspaceDto } from 'src/modules/workspace/application/dto/workspace/create-workspace.dto';

@Controller('workspaces')
@ReadRateLimit()
export class WorkspacesController {
  constructor(
    private readonly createWorkspaceHandler: CreateWorkspaceHandler,
    private readonly listWorkspacesHandler: ListWorkspacesHandler,
    private readonly getWorkspaceHandler: GetWorkspaceHandler,
    private readonly getWorkspaceAccessHandler: GetWorkspaceAccessHandler,
    private readonly listDeletedWorkspacesHandler: ListDeletedWorkspacesHandler,
    private readonly getWorkspaceOverviewHandler: GetWorkspaceOverviewHandler,
    private readonly updateWorkspaceHandler: UpdateWorkspaceHandler,
    private readonly updateWorkspaceLayoutModeHandler: UpdateWorkspaceLayoutModeHandler,
    private readonly softDeleteWorkspaceHandler: SoftDeleteWorkspaceHandler,
    private readonly restoreWorkspaceHandler: RestoreWorkspaceHandler,
    private readonly removeWorkspaceFromTrashHandler: RemoveWorkspaceFromTrashHandler,
    private readonly selectWorkspaceHandler: SelectWorkspaceHandler,
  ) {}

  @Post()
  @StrictWriteRateLimit()
  @ResponseMessage('Workspace created')
  async create(@Body() dto: CreateWorkspaceDto, @Auth() auth: IAuth) {
    return this.createWorkspaceHandler.execute(
      new CreateWorkspaceCommand(auth.id, dto.name),
    );
  }

  @Get()
  @ResponseMessage('Find all workspace')
  async findAllWorkspace(@Auth() auth: IAuth) {
    return this.listWorkspacesHandler.execute(new ListWorkspacesQuery(auth.id));
  }

  @Get('trash')
  @ResponseMessage('Find deleted workspaces')
  async findDeletedWorkspaces(@Auth() auth: IAuth) {
    return this.listDeletedWorkspacesHandler.execute(
      new ListDeletedWorkspacesQuery(auth.id),
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
    return this.getWorkspaceHandler.execute(
      new GetWorkspaceQuery(auth.id, workspaceId),
    );
  }

  @Get(':workspaceId/overview')
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  findOverview(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ): Promise<WorkspaceOverviewResponseDto> {
    return this.getWorkspaceOverviewHandler.execute(
      new GetWorkspaceOverviewQuery(auth.id, workspaceId),
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
    return this.getWorkspaceAccessHandler.execute(
      new GetWorkspaceAccessQuery(auth.id, workspaceId),
    );
  }

  @Patch(':workspaceId/select')
  @WriteRateLimit()
  @WorkspaceContext({ source: 'param', key: 'workspaceId' })
  @RequirePermissions(PERMISSIONS.WORKSPACE_READ)
  @ResponseMessage('Workspace selected')
  async selectWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Auth() auth: IAuth,
  ) {
    await this.selectWorkspaceHandler.execute(
      new SelectWorkspaceCommand(auth.id, workspaceId),
    );

    return {
      workspaceId,
    };
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
    return this.updateWorkspaceLayoutModeHandler.execute(
      new UpdateWorkspaceLayoutModeCommand(auth.id, workspaceId, dto),
    );
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
    return this.updateWorkspaceHandler.execute(
      new UpdateWorkspaceCommand(auth.id, workspaceId, dto),
    );
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
    return this.softDeleteWorkspaceHandler.execute(
      new SoftDeleteWorkspaceCommand(auth.id, workspaceId),
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
    return this.restoreWorkspaceHandler.execute(
      new RestoreWorkspaceCommand(auth.id, workspaceId),
    );
  }

  @Delete('trash/:workspaceId')
  @StrictWriteRateLimit()
  @ResponseMessage('Workspace removed from trash')
  async removeWorkspaceFromUserTrash(
    @Auth() auth: IAuth,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.removeWorkspaceFromTrashHandler.execute(
      new RemoveWorkspaceFromTrashCommand(auth.id, workspaceId),
    );
  }
}
