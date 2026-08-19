import { EntityManager } from 'typeorm';
import { WorkspaceMemberModel } from '../../domain/models/workspace-member.model';
import { CreateWorkspaceMemberDto } from '../../dto/workspace-member.dto';

export interface CreateWorkspaceMemberService {
  create(
    createWorkspaceMemberDto: CreateWorkspaceMemberDto,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberModel>;
}
