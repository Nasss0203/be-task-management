import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { type FindSprintReportsApplication } from '../interfaces/applications/find-sprint-reports.application.interface';
import { SPRINT_REPORT_TYPES } from '../interfaces/types';
import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

@Controller('sprint-reports')
export class SprintReportsController {
  constructor(
    @Inject(SPRINT_REPORT_TYPES.applications.FindSprintReportsApplication)
    private readonly findSprintReportsApplication: FindSprintReportsApplication,
  ) {}

  @Get('workspaces/:workspaceId/projects/:projectId')
  @ResponseMessage('Get all sprint reports successfully')
  async getSprintReports(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Auth() auth: IAuth,
  ) {
    return this.findSprintReportsApplication.execute(workspaceId, projectId);
  }
}
