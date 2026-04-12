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
import {
  AddWorkspaceMemberDto,
  CreateUserWorkspaceDto,
} from '../dto/create-user_workspace.dto';
import { MemberWorkspaceResponseDto } from '../dto/response/user_workspace.response.dto';
import { UpdateUserWorkspaceDto } from '../dto/update-user_workspace.dto';
import { type AddWorkspaceMemberApplication } from '../interfaces/applications/add-member-workspace.application.interface';
import { type FindAllMemberApplication } from '../interfaces/applications/find-user-workspace.application.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';
import { UserWorkspacesService } from '../user_workspace.service';

@Controller('workspace-members')
export class UserWorkspacesController {
  constructor(
    private readonly UserWorkspacesService: UserWorkspacesService,

    @Inject(USER_WORKSPACE_TYPES.applications.AddWorkspaceMemberApplication)
    private readonly addWorkspaceMemberApplication: AddWorkspaceMemberApplication,

    @Inject(USER_WORKSPACE_TYPES.applications.FindAllMemberApplication)
    private readonly findAllMemberApplication: FindAllMemberApplication,
  ) {}

  @Post()
  create(@Body() createUserWorkspaceDto: CreateUserWorkspaceDto) {
    return this.UserWorkspacesService.create(createUserWorkspaceDto);
  }

  @Post(':workspaceId/members')
  @ResponseMessage('Add member')
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_ADD)
  addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
    @Auth() auth: IAuth,
  ) {
    return this.addWorkspaceMemberApplication.addMember(
      workspaceId,
      dto,
      auth.id,
    );
  }

  @Get(':workspaceId/members')
  @ResponseMessage('Find member')
  @RequirePermissions(PERMISSIONS.WORKSPACE_MEMBER_READ)
  async findAllMember(
    @Param('workspaceId') workspaceId: string,
  ): Promise<MemberWorkspaceResponseDto[]> {
    return this.findAllMemberApplication.findAllMember(workspaceId);
  }

  @Get()
  findAll() {
    return this.UserWorkspacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.UserWorkspacesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserWorkspaceDto: UpdateUserWorkspaceDto,
  ) {
    return this.UserWorkspacesService.update(+id, updateUserWorkspaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.UserWorkspacesService.remove(+id);
  }
}
