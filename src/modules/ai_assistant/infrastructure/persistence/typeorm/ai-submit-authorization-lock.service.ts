import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiSubmitAuthorizationLock } from '../../../application/services/ai-submit-authorization-lock.port';

@Injectable()
export class AiSubmitAuthorizationLockService extends AiSubmitAuthorizationLock {
  async lock(
    conversation: AiConversation,
    context: PersistenceContext,
    userId: string,
  ): Promise<void> {
    const manager = context as EntityManager;
    if (!manager?.queryRunner?.isTransactionActive) {
      throw new Error(
        'AI Submit authorization locks require an active transaction',
      );
    }
    // Generation is already locked, as in Confirm/Discard. Stabilize scope too.
    const conversations = await manager.query<{ id: string }[]>(
      'SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2 FOR SHARE',
      [conversation.getId(), userId],
    );
    if (!conversations.length)
      throw new NotFoundException('AI conversation not found');

    const pageId = conversation.getPageId();
    if (pageId) {
      // Same root -> leaf order as Confirm, but no lock upgrade or content locks.
      const hierarchySql = `WITH RECURSIVE ancestors AS (
        SELECT id, parent_page_id, ARRAY[id] AS path FROM pages
        WHERE id = $1 AND deleted_at IS NULL
        UNION ALL
        SELECT p.id, p.parent_page_id, a.path || p.id
        FROM pages p JOIN ancestors a ON p.id = a.parent_page_id
        WHERE p.deleted_at IS NULL AND NOT p.id = ANY(a.path)
      ) SELECT id, parent_page_id FROM ancestors ORDER BY cardinality(path) DESC`;
      type Ancestor = { id: string; parent_page_id: string | null };
      const ancestors = await manager.query<Ancestor[]>(hierarchySql, [pageId]);
      if (!ancestors.length) throw new NotFoundException('Page not found');
      if (ancestors[0].parent_page_id !== null) {
        throw new ConflictException(
          'AI Page hierarchy changed during completion',
        );
      }
      for (const ancestor of ancestors) {
        const locked = await manager.query<{ id: string }[]>(
          'SELECT id FROM pages WHERE id = $1 AND deleted_at IS NULL FOR SHARE',
          [ancestor.id],
        );
        if (!locked.length) throw new NotFoundException('Page not found');
      }
      const current = await manager.query<Ancestor[]>(hierarchySql, [pageId]);
      if (JSON.stringify(ancestors) !== JSON.stringify(current)) {
        throw new ConflictException(
          'AI Page hierarchy changed during completion',
        );
      }
      const ids = ancestors.map(({ id }) => id);
      // Page SHARE locks conflict with withPagePermissionWriteLock's UPDATE,
      // including INSERTs that shadow inherited grants. Row locks alone cannot.
      await manager.query(
        'SELECT id FROM page_shares WHERE page_id = ANY($1::uuid[]) AND user_id = $2 ORDER BY id FOR SHARE',
        [ids, userId],
      );
      await manager.query(
        'SELECT id FROM page_share_settings WHERE page_id = ANY($1::uuid[]) ORDER BY id FOR SHARE',
        [ids],
      );
      await manager.query(
        'SELECT id FROM page_share_links WHERE page_id = $1 ORDER BY id FOR SHARE',
        [pageId],
      );
    }
    const workspaceId = conversation.getWorkspaceId();
    if (workspaceId) {
      // Keep permission-source order consistent with the existing Page locker.
      await manager.query(
        'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 ORDER BY id FOR SHARE',
        [workspaceId, userId],
      );
    }
    if (pageId) {
      await manager.query(
        `SELECT id FROM teamspace_members WHERE workspace_member_id IN (
          SELECT id FROM workspace_members WHERE user_id = $2
        ) AND teamspace_id = (SELECT teamspace_id FROM pages WHERE id = $1)
        ORDER BY id FOR SHARE`,
        [pageId, userId],
      );
      const teamspaces = await manager.query<{ workspace_id: string }[]>(
        `SELECT workspace_id FROM teamspaces
         WHERE id = (SELECT teamspace_id FROM pages WHERE id = $1)
         ORDER BY id FOR SHARE`,
        [pageId],
      );
      if (teamspaces.some((row) => row.workspace_id !== workspaceId)) {
        throw new ConflictException('AI Page teamspace workspace changed');
      }
    }
    // AuthorizationService uses separate READ COMMITTED queries, not this
    // EntityManager. Locked sources must stay stable until completion commits.
  }
}
