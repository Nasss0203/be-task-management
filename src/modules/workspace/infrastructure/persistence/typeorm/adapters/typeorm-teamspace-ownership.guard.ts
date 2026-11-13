import { ConflictException, Injectable } from '@nestjs/common';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import { WorkspaceMembershipType } from 'src/modules/workspace/domain/enums/workspace-membership-type.enum';
import type {
  TeamspaceHandover,
  TeamspaceOwnershipGuard,
} from 'src/modules/workspace/application/ports/teamspace-ownership-guard.port';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager } from 'typeorm';

@Injectable()
export class TypeOrmTeamspaceOwnershipGuard implements TeamspaceOwnershipGuard {
  async assertCanRemoveWorkspaceMember(
    workspaceId: string,
    workspaceMemberId: string,
    context: PersistenceContext,
  ): Promise<void> {
    const manager = context as EntityManager;
    const affectedTeamspaces = await this.lockAffectedTeamspaces(
      workspaceId,
      workspaceMemberId,
      manager,
    );

    for (const { id } of affectedTeamspaces) {
      const [owners] = await manager.query<
        Array<{ ownerCount: number; targetOwnerCount: number }>
      >(
        `SELECT COUNT(*)::int AS "ownerCount",
                COUNT(*) FILTER (WHERE workspace_member_id = $2)::int AS "targetOwnerCount"
         FROM teamspace_members
         WHERE teamspace_id = $1 AND role_name = $3`,
        [id, workspaceMemberId, TeamspaceRole.OWNER],
      );

      if (owners.targetOwnerCount > 0 && owners.ownerCount <= 1) {
        throw new ConflictException('Cannot remove the last Teamspace owner');
      }
    }
  }

  async handOverTeamspacesOf(
    workspaceId: string,
    workspaceMemberId: string,
    removedUserId: string,
    context: PersistenceContext,
  ): Promise<TeamspaceHandover[]> {
    const manager = context as EntityManager;
    const affected = await this.lockAffectedTeamspaces(
      workspaceId,
      workspaceMemberId,
      manager,
    );
    const handovers: TeamspaceHandover[] = [];

    for (const { id } of affected) {
      const [state] = await manager.query<
        Array<{ name: string; ownerCount: number; targetOwnerCount: number }>
      >(
        `SELECT teamspace.name,
                COUNT(member.id) FILTER (WHERE member.role_name = $3)::int AS "ownerCount",
                COUNT(member.id) FILTER (
                  WHERE member.role_name = $3 AND member.workspace_member_id = $2
                )::int AS "targetOwnerCount"
         FROM teamspaces teamspace
         LEFT JOIN teamspace_members member ON member.teamspace_id = teamspace.id
         WHERE teamspace.id = $1
         GROUP BY teamspace.id`,
        [id, workspaceMemberId, TeamspaceRole.OWNER],
      );
      if (!state || state.targetOwnerCount === 0 || state.ownerCount > 1) {
        continue;
      }

      const [successor] = await manager.query<
        Array<{ id: string; workspace_member_id: string; user_id: string }>
      >(
        `SELECT member.id, member.workspace_member_id, workspace_member.user_id
         FROM teamspace_members member
         JOIN workspace_members workspace_member
           ON workspace_member.id = member.workspace_member_id
         WHERE member.teamspace_id = $1
           AND member.workspace_member_id <> $2
           AND workspace_member.membership_type = $3
         ORDER BY member.joined_at ASC, member.id ASC
         LIMIT 1`,
        [id, workspaceMemberId, WorkspaceMembershipType.MEMBER],
      );

      if (successor) {
        await manager.query(
          `UPDATE teamspace_members
           SET role_name = $2, updated_at = now()
           WHERE id = $1`,
          [successor.id, TeamspaceRole.OWNER],
        );
      } else {
        await manager.query(
          `UPDATE teamspaces
           SET deleted_at = now(), deleted_by = $2, updated_at = now()
           WHERE id = $1`,
          [id, removedUserId],
        );
      }

      handovers.push({
        teamspaceId: id,
        teamspaceName: state.name,
        newOwnerUserId: successor?.user_id ?? null,
        newOwnerWorkspaceMemberId: successor?.workspace_member_id ?? null,
      });
    }

    return handovers;
  }

  private async lockAffectedTeamspaces(
    workspaceId: string,
    workspaceMemberId: string,
    manager: EntityManager,
  ): Promise<Array<{ id: string }>> {
    await manager.query(
      `SELECT id FROM workspace_members
       WHERE id = $1 AND workspace_id = $2
       FOR UPDATE`,
      [workspaceMemberId, workspaceId],
    );

    const affectedTeamspaces = await manager.query<Array<{ id: string }>>(
      `SELECT DISTINCT teamspace.id
   FROM teamspaces teamspace
   JOIN teamspace_members member
     ON member.teamspace_id = teamspace.id
   WHERE member.workspace_member_id = $1
     AND teamspace.workspace_id = $2
     AND teamspace.deleted_at IS NULL
   ORDER BY teamspace.id`,
      [workspaceMemberId, workspaceId],
    );

    for (const { id } of affectedTeamspaces) {
      await manager.query(
        `SELECT id FROM teamspaces WHERE id = $1 FOR UPDATE`,
        [id],
      );
    }

    return affectedTeamspaces;
  }
}
