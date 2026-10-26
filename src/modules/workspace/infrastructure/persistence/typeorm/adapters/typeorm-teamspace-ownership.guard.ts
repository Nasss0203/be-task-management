import { ConflictException, Injectable } from '@nestjs/common';
import { TeamspaceRole } from 'src/modules/teamspace/domain/enums/teamspace-role.enum';
import type { TeamspaceOwnershipGuard } from 'src/modules/workspace/application/ports/teamspace-ownership-guard.port';
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
}
