import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { TeamspaceRepository } from 'src/modules/teamspace/domain/repositories/teamspace.repository';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { ArchiveTeamspaceCommand } from './archive-teamspace.command';

@Injectable()
export class ArchiveTeamspaceHandler {
  constructor(
    @Inject(TEAMSPACE_TYPES.repositories.TeamspaceRepository)
    private readonly teamspaceRepo: TeamspaceRepository,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: ArchiveTeamspaceCommand): Promise<void> {
    const teamspace = await this.teamspaceRepo.findById(command.teamspaceId);
    if (!teamspace) {
      throw new NotFoundException('Teamspace not found');
    }

    if (
      !(await this.authorizationService.authorize({
        userId: command.userId,
        permissions: [PERMISSIONS.TEAMSPACE_DELETE],
        target: { type: 'teamspace', id: command.teamspaceId },
      }))
    ) {
      throw new ForbiddenException(
        'You do not have permission to archive this teamspace',
      );
    }

    // Archive = soft delete: every read path already filters deleted_at.
    teamspace.markAsDeleted(command.userId);
    await this.teamspaceRepo.save(teamspace);
  }
}
