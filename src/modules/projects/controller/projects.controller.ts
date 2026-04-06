import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
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
  @ResponseMessage('Create Project')
  createProjectWithPageBlock(
    @Body() createProjectDto: CreateProjectDto,
    @Auth() auth: IAuth,
  ) {
    return this.createProjectApplication.createProjectWithPageBlock({
      ...createProjectDto,
      created_by: auth.id,
    });
  }
}
