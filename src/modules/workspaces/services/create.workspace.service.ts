import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { generateSlug } from 'src/utils';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { type WorkspaceRepository } from '../interfaces/repositories/workspace.repository.interface';
import { CreateWorkspaceService } from '../interfaces/services/create.workspace.service.interface';
import { WORKSPACETYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkSpaceServiceImpl implements CreateWorkspaceService {
  constructor(
    @Inject(WORKSPACETYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepo: WorkspaceRepository,

    // @Inject(WORKSPACETYPES.services.RbacHelper)
    // private readonly rbacHelper: RbacHelper,

    @Inject(WORKSPACETYPES.uow.UnitOfWork)
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

      //  // 3) đảm bảo roles của tenant đã có (owner/member/...)
      //   const { ownerRole } = await this.rbacHelper.ensureTenantRoles(tenant.id);

      //   // 4) gán owner membership cho user tạo workspace
      //   await this.userTenantRepo.addMember({
      //     userId,
      //     tenantId: tenant.id,
      //     roleId: ownerRole.id,
      //   });

      return workspace;
    });
  }
}
