import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { type CreateActivityService } from 'src/modules/activity/interfaces/services/create-activity.service.interface';
import { ACTIVITY_TYPES } from 'src/modules/activity/interfaces/types';
import { WorkspaceMemberResponseDto } from 'src/modules/workspace/application/dto/workspace-member/response/workspace-member.response.dto';
import { WorkspaceMember } from 'src/modules/workspace/domain/aggregates/workspace-member/workspace-member.aggregate';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import type { WorkspaceMemberRepository } from 'src/modules/workspace/domain/repositories/workspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import { AddWorkspaceMemberCommand } from './add-workspace-member.command';

@Injectable()
export class AddWorkspaceMemberHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceMemberRepository)
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(ACTIVITY_TYPES.services.CreateActivityService)
    private readonly createActivityService: CreateActivityService,
  ) {}

  async execute(
    command: AddWorkspaceMemberCommand,
  ): Promise<WorkspaceMemberResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const roleName = command.roleName ?? WorkspaceRole.MEMBER;

      if ([WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(roleName)) {
        const actorMember =
          command.addedBy &&
          (await this.workspaceMemberRepository.findByWorkspaceAndUser(
            command.workspaceId,
            command.addedBy,
            manager,
          ));

        if (!actorMember || actorMember.getRole() !== WorkspaceRole.OWNER) {
          throw new ForbiddenException(
            'Only workspace owner can add owner or admin members',
          );
        }
      }

      const existed =
        await this.workspaceMemberRepository.findByWorkspaceAndUser(
          command.workspaceId,
          command.userId,
          manager,
        );

      if (existed) {
        throw new ConflictException('User already belongs to this workspace');
      }

      const member = await this.workspaceMemberRepository.save(
        WorkspaceMember.create({
          workspaceId: command.workspaceId,
          userId: command.userId,
          role: roleName,
        }),
        manager,
      );

      await this.createActivityService.create(
        {
          workspaceId: command.workspaceId,
          entityType: ActivityEntityType.WORKSPACE,
          entityId: command.workspaceId,
          actorId: command.addedBy,
          action: ActivityAction.WORKSPACE_MEMBER_JOINED,
          metadata: {
            userId: command.userId,
            roleName,
          },
        },
        manager,
      );

      return WorkspaceMemberResponseDto.fromDomain(member);
    });
  }
}
