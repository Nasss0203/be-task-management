import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, RoleName } from 'src/modules/role/domain/entities/role.entity';
import { UserRole } from 'src/modules/user_roles/domain/entities/user_role.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import {
  WorkspaceInvite,
  WorkspaceInviteStatus,
} from 'src/modules/workspace_invites/domain/entities/workspace_invite.entity';
import { EntityManager, Repository } from 'typeorm';
import { Workspace } from '../domain/entities/workspace.entity';
import {
  WorkspaceMemberSummaryModel,
  WorkspaceOwnerSummaryModel,
} from '../domain/models/workspace-member-summary.model';
import { AdminWorkspaceMemberSummaryRepository } from '../interfaces/repositories/admin-workspace-member-summary.repository.interface';

@Injectable()
export class AdminWorkspaceMemberSummaryRepositoryImpl implements AdminWorkspaceMemberSummaryRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(UserWorkspace)
    private readonly userWorkspaceRepo: Repository<UserWorkspace>,
    @InjectRepository(WorkspaceInvite)
    private readonly workspaceInviteRepo: Repository<WorkspaceInvite>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private getWorkspaceRepo(manager?: EntityManager): Repository<Workspace> {
    return manager ? manager.getRepository(Workspace) : this.workspaceRepo;
  }

  private getUserWorkspaceRepo(
    manager?: EntityManager,
  ): Repository<UserWorkspace> {
    return manager
      ? manager.getRepository(UserWorkspace)
      : this.userWorkspaceRepo;
  }

  private getWorkspaceInviteRepo(
    manager?: EntityManager,
  ): Repository<WorkspaceInvite> {
    return manager
      ? manager.getRepository(WorkspaceInvite)
      : this.workspaceInviteRepo;
  }

  private getRoleRepo(manager?: EntityManager): Repository<Role> {
    return manager ? manager.getRepository(Role) : this.roleRepo;
  }

  private getUserRoleRepo(manager?: EntityManager): Repository<UserRole> {
    return manager ? manager.getRepository(UserRole) : this.userRoleRepo;
  }

  private getUserRepo(manager?: EntityManager): Repository<User> {
    return manager ? manager.getRepository(User) : this.userRepo;
  }

  async getMemberSummary(
    workspaceId: string,
    manager?: EntityManager,
  ): Promise<WorkspaceMemberSummaryModel> {
    const workspace = await this.getWorkspaceRepo(manager).findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const [memberCount, inviteCount, ownerRole] = await Promise.all([
      this.getUserWorkspaceRepo(manager).count({
        where: { workspace_id: workspaceId },
      }),
      this.getWorkspaceInviteRepo(manager).count({
        where: {
          workspace_id: workspaceId,
          status: WorkspaceInviteStatus.PENDING,
        },
      }),
      this.getRoleRepo(manager).findOne({
        where: {
          workspace_id: workspaceId,
          name: RoleName.OWNER,
        },
      }),
    ]);

    let owner: WorkspaceOwnerSummaryModel | null = null;

    if (ownerRole) {
      const ownerUserRole = await this.getUserRoleRepo(manager).findOne({
        where: {
          workspace_id: workspaceId,
          role_id: ownerRole.id,
        },
      });

      if (ownerUserRole) {
        const ownerUser = await this.getUserRepo(manager).findOne({
          where: { id: ownerUserRole.user_id },
        });

        if (ownerUser) {
          owner = new WorkspaceOwnerSummaryModel(
            ownerUser.id,
            ownerUser.username,
            ownerUser.email,
          );
        }
      }
    }

    return new WorkspaceMemberSummaryModel(
      workspaceId,
      owner,
      memberCount,
      inviteCount,
    );
  }
}
