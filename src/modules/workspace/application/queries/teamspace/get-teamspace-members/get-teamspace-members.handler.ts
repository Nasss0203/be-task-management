import { ForbiddenException, Inject, Injectable } from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import type { TeamspaceMemberRepository } from 'src/modules/workspace/domain/repositories/teamspace-member.repository';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';

import { GetTeamspaceMembersQuery } from './get-teamspace-members.query';

@Injectable()
export class GetTeamspaceMembersHandler {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.TeamspaceMemberRepository)
    private readonly teamspaceMemberRepo: TeamspaceMemberRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(query: GetTeamspaceMembersQuery) {
    const allowed = await this.authorizationService.authorize({
      userId: query.userId,
      permissions: [PERMISSIONS.TEAMSPACE_MEMBER_READ],
      target: {
        type: 'teamspace',
        id: query.teamspaceId,
      },
    });

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to view teamspace members',
      );
    }

    return this.teamspaceMemberRepo.findByTeamspaceId(query.teamspaceId);
  }
}
