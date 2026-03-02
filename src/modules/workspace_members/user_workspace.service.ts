import { Injectable } from '@nestjs/common';
import { CreateUserWorkspaceDto } from './dto/create-user_workspace.dto';
import { UpdateUserWorkspaceDto } from './dto/update-user_workspace.dto';

@Injectable()
export class UserWorkspacesService {
  create(createUserWorkspaceDto: CreateUserWorkspaceDto) {
    return 'This action adds a new UserWorkspace';
  }

  findAll() {
    return `This action returns all UserWorkspaces`;
  }

  findOne(id: number) {
    return `This action returns a #${id} UserWorkspace`;
  }

  update(id: number, updateUserWorkspaceDto: UpdateUserWorkspaceDto) {
    return `This action updates a #${id} UserWorkspace`;
  }

  remove(id: number) {
    return `This action removes a #${id} UserWorkspace`;
  }
}
