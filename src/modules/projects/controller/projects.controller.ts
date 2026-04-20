import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { RequirePermissions } from 'src/common/decorator/require-permissions.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import { type IAuth } from 'src/types/auth';
import { CreateProjectDto } from '../dto/create-project.dto';
import { type CreateProjectApplication } from '../interfaces/applications/create-project.application.interface';
import { type FindProjectApplication } from '../interfaces/applications/find.project.application.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(PROJECT_TYPES.applications.FindProjectApplication)
    private readonly findProjectApplication: FindProjectApplication,

    @Inject(PROJECT_TYPES.applications.CreateProjectApplication)
    private readonly createProjectApplication: CreateProjectApplication,
  ) {}

  @Get('/workspace/:workspaceId')
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
}
