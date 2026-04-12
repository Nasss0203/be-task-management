import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserWorkspace } from '../domain/entities/user_workspace.entity';
import { MemberWorkspaceModel } from '../domain/models/user_workspace.model';
import { type FindUserWorkspaceRepository } from '../interfaces/repositories/find-user-workspace.repository.interface';
import { FindAllMemberService } from '../interfaces/services/find-user-workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class FindAllMemberServiceImpl implements FindAllMemberService {
  constructor(
    @InjectRepository(UserWorkspace)
    private readonly repoUserworkspace: Repository<UserWorkspace>,

    @Inject(USER_WORKSPACE_TYPES.repositories.FindUserWorkspaceRepository)
    private readonly findUserWorkspaceRepository: FindUserWorkspaceRepository,
  ) {}

  private getRepo(manager?: EntityManager): Repository<UserWorkspace> {
    return manager
      ? manager.getRepository(UserWorkspace)
      : this.repoUserworkspace;
  }

  async findAllMember(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<MemberWorkspaceModel[]> {
    if (!workspaceId?.trim()) {
      throw new BadRequestException('workspaceId is required');
    }

    return this.findUserWorkspaceRepository.findAllMember(workspaceId, manager);
  }
}
