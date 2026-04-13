import { Injectable } from '@nestjs/common';
import { CreateWorkspaceInviteDto } from './dto/create-workspace_invite.dto';
import { UpdateWorkspaceInviteDto } from './dto/update-workspace_invite.dto';

@Injectable()
export class WorkspaceInvitesService {
  create(createWorkspaceInviteDto: CreateWorkspaceInviteDto) {
    return 'This action adds a new workspaceInvite';
  }

  findAll() {
    return `This action returns all workspaceInvites`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workspaceInvite`;
  }

  update(id: number, updateWorkspaceInviteDto: UpdateWorkspaceInviteDto) {
    return `This action updates a #${id} workspaceInvite`;
  }

  remove(id: number) {
    return `This action removes a #${id} workspaceInvite`;
  }
}
