import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type UnitOfWork } from 'src/interface/index.interface';
import { Role } from 'src/modules/role/entities/role.entity';
import { type CreateUserWorkspaceService } from 'src/modules/workspace_members/interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/workspace_members/interfaces/types';
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

    @Inject(USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService)
    private readonly createUserWorkspaceService: CreateUserWorkspaceService,

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

      //join membership
      await this.createUserWorkspaceService.create({
        user_id: userId,
        workspace_id: workspace.id,
      });

      // Todo: ensure roles

      // Todo: assign OWNER to user_roles

      return workspace;
    });
  }
}
