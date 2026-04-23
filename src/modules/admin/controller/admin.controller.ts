import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { WorkspaceResponseDto } from 'src/modules/workspaces/dto/response/workspaces.response.dto';
import { AdminFindAllWorkspaceQueryDto } from 'src/modules/workspaces/dto/search-workspace.dto';
import { AdminService } from '../admin.service';
import { AdminFindAllWorkspaceApplication } from '../interfaces/applications/admin-findAll-workspace.application.interface';
import { ADMIN_TYPES } from '../interfaces/types';
import { AdminFindAllWorkspaceApplicationImpl } from '../applications/admin-findAll-workspace.application';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    @Inject(ADMIN_TYPES.applications.AdminFindAllWorkspaceApplication)
    private readonly adminFindAllWorkspaceApplication: AdminFindAllWorkspaceApplicationImpl,
  ) {}

  @Get('findAll-workspaces')
  @ResponseMessage('get all workspaces by admin successfully')
  findAllWorkspace(
    @Query() query: AdminFindAllWorkspaceQueryDto,
  ): Promise<WorkspaceResponseDto[]> {
    return this.adminFindAllWorkspaceApplication.findAllWorkspace(query);
  }
}
