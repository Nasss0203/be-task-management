import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { TeamspaceMembershipLock } from 'src/modules/teamspace/application/ports/teamspace-membership-lock.port';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager } from 'typeorm';

@Injectable()
export class TypeOrmTeamspaceMembershipLock implements TeamspaceMembershipLock {
  async lockForCreation(
    workspaceMemberId: string,
    workspaceId: string,
    context: PersistenceContext,
  ): Promise<void> {
    const manager = context as EntityManager;
    if (!manager.queryRunner?.isTransactionActive) {
      throw new Error('Teamspace creation lock requires an active transaction');
    }
    const member = await manager.query<Array<{ id: string }>>(
      `SELECT id FROM workspace_members WHERE id = $1 AND workspace_id = $2 FOR UPDATE`,
      [workspaceMemberId, workspaceId],
    );
    if (member.length === 0) throw new NotFoundException('Workspace member not found');
    await this.lockActiveWorkspace(workspaceId, manager);
  }

  private async lockActiveWorkspace(workspaceId: string, manager: EntityManager): Promise<void> {
    const workspace = await manager.query<Array<{ id: string }>>(
      `SELECT id FROM workspaces WHERE id = $1 AND deleted_at IS NULL FOR SHARE`,
      [workspaceId],
    );
    if (workspace.length === 0) throw new NotFoundException('Workspace not found');
  }

  async lockForMembershipChange(
    workspaceMemberId: string,
    teamspaceId: string,
    actorUserId: string,
    context: PersistenceContext,
  ): Promise<void> {
    const manager = context as EntityManager;
    if (!manager.queryRunner?.isTransactionActive) {
      throw new Error(
        'Teamspace membership lock requires an active transaction',
      );
    }

    const [teamspace] = await manager.query<Array<{ workspace_id: string }>>(
      `SELECT workspace_id FROM teamspaces WHERE id = $1 AND deleted_at IS NULL`,
      [teamspaceId],
    );
    if (!teamspace) {
      throw new NotFoundException('Teamspace not found');
    }

    const [actor] = await manager.query<Array<{ id: string }>>(
      `SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [teamspace.workspace_id, actorUserId],
    );

    // Lock every involved WorkspaceMember before the Teamspace, as in TS-1.1.
    for (const id of [
      ...new Set(
        [workspaceMemberId, actor?.id].filter((id): id is string => !!id),
      ),
    ].sort()) {
      const rows = await manager.query<Array<{ id: string }>>(
        `SELECT id FROM workspace_members WHERE id = $1 AND workspace_id = $2 FOR UPDATE`,
        [id, teamspace.workspace_id],
      );
      if (id === workspaceMemberId && rows.length === 0) {
        throw new NotFoundException('Workspace member not found');
      }
    }

    // A deleted actor can be re-added under a new WorkspaceMember ID while
    // this transaction waits for a row lock. Never authorize that new row.
    const [currentActor] = await manager.query<Array<{ id: string }>>(
      `SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
      [teamspace.workspace_id, actorUserId],
    );
    if (!actor || !currentActor || currentActor.id !== actor.id) {
      throw new ForbiddenException('Actor workspace membership changed');
    }

    await this.lockActiveWorkspace(teamspace.workspace_id, manager);

    const locked = await manager.query<Array<{ id: string }>>(
      `SELECT id FROM teamspaces WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL FOR UPDATE`,
      [teamspaceId, teamspace.workspace_id],
    );
    if (locked.length === 0) {
      throw new NotFoundException('Teamspace not found');
    }
  }
}
