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
  ) {}

  async execute(
    command: RestoreTeamspaceCommand,
  ): Promise<TeamspaceResponseDto> {
    // The query only returns teamspaces the user owns (or owns the workspace of),
    // so "no permission" and "not archived" both surface as 404.
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

      teamspace.restoreDeleted();
      const saved = await this.teamspaceRepo.save(teamspace, context);
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
}
