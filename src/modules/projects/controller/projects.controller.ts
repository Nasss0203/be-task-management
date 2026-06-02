import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateProjectDto } from '../dto/create-project.dto';
import { type CreateProjectApplication } from '../interfaces/applications/create-project.application.interface';
import { type DeleteProjectApplication } from '../interfaces/applications/delete-project.application.interface';
import { type FindProjectApplication } from '../interfaces/applications/find.project.application.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(PROJECT_TYPES.applications.FindProjectApplication)
    private readonly findProjectApplication: FindProjectApplication,

    @Inject(PROJECT_TYPES.applications.CreateProjectApplication)
    private readonly createProjectApplication: CreateProjectApplication,

    @Inject(PROJECT_TYPES.applications.DeleteProjectApplication)
    private readonly deleteProjectApplication: DeleteProjectApplication,
  ) {}

  @Get('/workspace/:workspaceId')
  @RequirePermissions(PERMISSIONS.PROJECT_READ)
  @ResponseMessage('Find all project')
  async findAllByWorkspaceId(@Param('workspaceId') workspaceId: string) {
    return this.findProjectApplication.findAllByWorkspaceId(workspaceId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PROJECT_CREATE)
  @ResponseMessage('Create Project')
  async createProjectWithPageBlock(
    @Body() createProjectDto: CreateProjectDto,
    @Auth() auth: IAuth,
  ) {
    return await this.createProjectApplication.createProjectWithPageBlock({
      ...createProjectDto,
      created_by: auth.id,
    });
  }

  @Get('trash')
  @RequirePermissions(PERMISSIONS.PROJECT_READ)
  async findDeletedProjects(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findProjectApplication.findDeletedProjects(workspaceId);
  }

  @Delete('workspaces/:workspaceId/projects/:projectId')
  @RequirePermissions(PERMISSIONS.PROJECT_DELETE)
  async deleteProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteProjectApplication.delete({
      workspaceId,
      projectId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }

  @Patch('workspaces/:workspaceId/projects/:projectId/restore')
  @RequirePermissions(PERMISSIONS.PROJECT_DELETE)
  async restoreProject(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Auth() auth: IAuth,
  ) {
    await this.deleteProjectApplication.restore({
      workspaceId,
      projectId,
      userId: auth.id,
    });

    return {
      success: true,
    };
  }
}
