import { ACTIVITY_TYPES } from 'src/modules/activity/activity.types';
import { type CreateActivityService } from 'src/modules/activity/application/ports/create-activity.service.port';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BILLING_TYPES } from 'src/modules/billing/billing.types';
import type { WorkspaceEntitlementPort } from 'src/modules/billing/application/ports/workspace-entitlement.port';
import { BillingFeatureCode } from 'src/modules/billing/domain/constants/billing-feature-code.constant';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { TeamspaceResponseDto } from 'src/modules/teamspace/application/dto/teamspace/response/teamspace.response.dto';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceMemberRepository } from 'src/modules/teamspace/domain/repositories/teamspace-member.repository';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { RestoreTeamspaceCommand } from './restore-teamspace.command';

@Injectable()
export class RestoreTeamspaceHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
    @Inject(BILLING_TYPES.services.WorkspaceEntitlementPort)
    private readonly entitlements: WorkspaceEntitlementPort,
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly memberRepo: TeamspaceMemberRepository,
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
  ) {}

  async execute(
    command: RestoreTeamspaceCommand,
  ): Promise<TeamspaceResponseDto> {
    const [teamspace] = await this.teamspaceRepo.findArchivedManageableByUser(
      command.userId,
      { teamspaceId: command.teamspaceId },
    );
    if (!teamspace) {
      throw new NotFoundException('Archived teamspace not found');
    }

    const restored = await this.unitOfWork.runInTransaction(async (context) => {
      await this.entitlements.assertWithinLimit(
        teamspace.getWorkspaceId(),
        BillingFeatureCode.MAX_TEAMSPACES,
        1,
        context,
      );

      const restorer = await this.workspaceMemberRepo.findByWorkspaceAndUser(
        teamspace.getWorkspaceId(),
        command.userId,
        context,
      );
      if (!restorer || restorer.isGuest()) {
        throw new NotFoundException('Archived teamspace not found');
      }

      teamspace.restoreDeleted();
      const saved = await this.teamspaceRepo.save(teamspace, context);
      await this.makeRestorerOwner(
        teamspace.getId(),
        restorer.getId(),
        context,
      );
      await this.createActivityService.create(
        {
          workspaceId: teamspace.getWorkspaceId(),
          entityType: ActivityEntityType.TEAMSPACE,
          entityId: teamspace.getId(),
          actorId: command.userId,
          action: ActivityAction.TEAMSPACE_RESTORED,
        },
        context,
      );
      return saved;
    });
    return TeamspaceResponseDto.fromDomain(restored);
  }

  private async makeRestorerOwner(
    teamspaceId: string,
    workspaceMemberId: string,
    context: PersistenceContext,
  ): Promise<void> {
    const existing = await this.memberRepo.findByTeamspaceAndWorkspaceMember(
      teamspaceId,
      workspaceMemberId,
      context,
    );
    if (existing?.getRoleName() === TeamspaceRole.OWNER) {
      return;
    }

    if (existing) {
      existing.changeRole(TeamspaceRole.OWNER);
      await this.memberRepo.save(existing, context);
      return;
    }

    await this.memberRepo.save(
      TeamspaceMember.create({
        teamspaceId,
        workspaceMemberId,
        roleName: TeamspaceRole.OWNER,
      }),
      context,
    );
  }
}
