import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type UnitOfWork } from 'src/interface/index.interface';
import { Role, RoleName } from 'src/modules/role/entities/role.entity';
import { type CreateWorkspaceMemberService } from 'src/modules/workspace_members/interfaces/services/create.workspace-member.service.interface';
import { WORKSPACE_MEMBER_TYPES } from 'src/modules/workspace_members/interfaces/types';
import { generateSlug } from 'src/utils';
import { Repository } from 'typeorm';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { type WorkspaceRepository } from '../interfaces/repositories/workspace.repository.interface';
import { CreateWorkspaceService } from '../interfaces/services/create.workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkSpaceServiceImpl implements CreateWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepo: WorkspaceRepository,

    @Inject(WORKSPACE_MEMBER_TYPES.services.CreateWorkspaceMemberService)
    private readonly createWorkspaceMemberService: CreateWorkspaceMemberService,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}
  async create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceModel> {
    const slug = generateSlug(createWorkspaceDto.name).toLowerCase();

    return this.uow.runInTransaction(async () => {
      const exists = await this.workspaceRepo.existsBySlug(slug);
      if (exists)
        throw new HttpException(
          'Workspace slug already exists',
          HttpStatus.CONFLICT,
        );

      const workspace = await this.workspaceRepo.save({
        ...createWorkspaceDto,
        slug,
        planType: createWorkspaceDto.planType ?? PlanTypeWorkspace.FREE,
      });

      // Todo: Create module role
      const ownerRole = await this.roleRepo.save(
        this.roleRepo.create({
          workspace_id: workspace.id,
          name: RoleName.OWNER,
        }),
      );

      await this.createWorkspaceMemberService.create({
        user_id: userId,
        role_id: ownerRole.id,
        workspace_id: workspace.id,
      });

      return workspace;
    });
  }
}
