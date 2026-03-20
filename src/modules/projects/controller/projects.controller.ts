import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type FindProjectApplication } from '../interfaces/applications/find.project.application.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Controller('projects')
export class ProjectsController {
  constructor(
    @Inject(PROJECT_TYPES.applications.FindProjectApplication)
    private readonly findProjectApplication: FindProjectApplication,
  ) {}

  @Get('/workspace/:workspaceId')
  @ResponseMessage('Find all project')
  async findAllByWorkspaceId(@Param('workspaceId') workspaceId: string) {
    return this.findProjectApplication.findAllByWorkspaceId(workspaceId);
  }
}
