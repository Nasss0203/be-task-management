import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type RoleRepository } from 'src/modules/role/interfaces/repositories/role.repository.interface';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { type CreateUserRoleService } from 'src/modules/user_roles/interfaces/services/create.user_role.service.interface';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { type CreateUserWorkspaceService } from 'src/modules/user_workspace/interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { generateSlug } from 'src/utils';
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

    @Inject(ROLE_TYPES.repositories.RoleRepository)
    private readonly roleRepository: RoleRepository,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(USER_ROLE_TYPES.services.CreateUserRoleService)
    private readonly createUserRoleService: CreateUserRoleService,
  ) {}

  async create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceModel> {
    const slug = generateSlug(createWorkspaceDto.name).toLowerCase();

    return this.uow.runInTransaction(async (manager) => {
      const exists = await this.workspaceRepo.existsBySlug(slug, manager);
      if (exists) {
        throw new HttpException(
          'Workspace slug already exists',
          HttpStatus.CONFLICT,
        );
      }

      // Create workspace
      const workspace = await this.workspaceRepo.save(
        {
          ...createWorkspaceDto,
          slug,
          planType: createWorkspaceDto.planType ?? PlanTypeWorkspace.FREE,
        },
        manager,
      );

      // creator joined workspace
      await this.createUserWorkspaceService.create(
        {
          user_id: userId,
          workspace_id: workspace.id,
        },
        manager,
      );

      // 3. Seed roles mặc định
      const roles = await this.roleRepository.saveMany(
        [
          {
            name: RoleName.OWNER,
            workspace_id: workspace.id,
          },
          {
            name: RoleName.MEMBER,
            workspace_id: workspace.id,
          },
        ],
        manager,
      );

      const ownerRole = roles.find((role: any) => role.name === RoleName.OWNER);

      if (!ownerRole) {
        throw new HttpException(
          'Owner role was not created',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 4. Create user_roles (assign Owner cho creator)
      await this.createUserRoleService.create(
        {
          ...this.createUserRoleService,
          user_id: userId,
          role_id: ownerRole.id,
          workspace_id: workspace.id,
          assigned_by: userId,
        },
        manager,
      );

      // 5. Prepare / show templates

      // 6. Nếu user chọn template:

      // 6.1 Create project

      // 6.2 Create board

      // 6.3 Seed task status

      // 6.4 Seed task priority

      // 6.5 Create sample tasks

      return workspace;
    });
  }
}
