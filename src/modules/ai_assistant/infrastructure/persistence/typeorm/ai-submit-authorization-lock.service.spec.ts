import { ConflictException, NotFoundException } from '@nestjs/common';
import { AiConversation } from '../../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../../domain/enums/ai-conversation-scope.enum';
import { AiSubmitAuthorizationLockService } from './ai-submit-authorization-lock.service';

describe('AiSubmitAuthorizationLockService (offline SQL contract)', () => {
  const conversation = (page = true) =>
    AiConversation.create({
      id: 'conversation-1',
      userId: 'user-1',
      workspaceId: 'workspace-1',
      scope: page ? AiConversationScope.PAGE : AiConversationScope.GLOBAL,
      pageId: page ? 'page-1' : null,
    });
  const ancestors = [
    { id: 'root', parent_page_id: null },
    { id: 'page-1', parent_page_id: 'root' },
  ];
  function fixture() {
    const query = jest.fn((sql: string) =>
      Promise.resolve(
        sql.startsWith('WITH RECURSIVE') ? ancestors : [{ id: 'row' }],
      ),
    );
    const context = { queryRunner: { isTransactionActive: true }, query };
    return { query, context, service: new AiSubmitAuthorizationLockService() };
  }

  it('requires an active transaction before issuing any SQL', async () => {
    const f = fixture();
    f.context.queryRunner.isTransactionActive = false;
    await expect(
      f.service.lock(conversation(), f.context, 'user-1'),
    ).rejects.toThrow('active transaction');
    expect(f.query).not.toHaveBeenCalled();
  });

  it('locks scope, hierarchy root to leaf, and permission sources without Page content', async () => {
    const f = fixture();
    f.query.mockImplementation(
      (sql: string) =>
        Promise.resolve(
          sql.startsWith('WITH RECURSIVE')
            ? ancestors
            : sql.startsWith('SELECT workspace_id')
              ? [{ workspace_id: 'workspace-1' }]
              : [{ id: 'row' }],
        ) as never,
    );
    await f.service.lock(conversation(), f.context, 'user-1');
    const calls = f.query.mock.calls as unknown as [string, unknown[]][];
    expect(calls[0]).toEqual([
      'SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2 FOR SHARE',
      ['conversation-1', 'user-1'],
    ]);
    expect(calls[2]).toEqual([
      'SELECT id FROM pages WHERE id = $1 AND deleted_at IS NULL FOR SHARE',
      ['root'],
    ]);
    expect(calls[3]).toEqual([
      'SELECT id FROM pages WHERE id = $1 AND deleted_at IS NULL FOR SHARE',
      ['page-1'],
    ]);
    const tables = [
      'page_shares',
      'page_share_settings',
      'page_share_links',
      'workspace_members',
      'teamspace_members',
      'teamspaces',
    ];
    tables.forEach((table, index) =>
      expect(calls[index + 5][0]).toContain(`FROM ${table}`),
    );
    expect(calls[5][1]).toEqual([['root', 'page-1'], 'user-1']);
    expect(calls.map(([sql]) => sql).join('\n')).not.toMatch(
      /page_blocks|databases|FOR UPDATE/,
    );
  });

  it('locks workspace membership for GLOBAL conversations', async () => {
    const f = fixture();
    await f.service.lock(conversation(false), f.context, 'user-1');
    expect(f.query).toHaveBeenCalledTimes(2);
    expect(f.query).toHaveBeenLastCalledWith(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 ORDER BY id FOR SHARE',
      ['workspace-1', 'user-1'],
    );
  });

  it.each([
    'conversation missing',
    'page missing',
    'ancestor deleted',
    'hierarchy moved',
    'broken hierarchy',
    'teamspace moved',
  ])('fails closed if %s wins before locking', async (kind) => {
    const f = fixture();
    let discovery = 0;
    f.query.mockImplementation((sql: string) => {
      if (
        sql.includes('FROM ai_conversations') &&
        kind === 'conversation missing'
      )
        return Promise.resolve([]);
      if (sql.startsWith('WITH RECURSIVE')) {
        discovery++;
        if (kind === 'page missing') return Promise.resolve([]);
        if (kind === 'broken hierarchy')
          return Promise.resolve([
            { id: 'page-1', parent_page_id: 'unlocked' },
          ]);
        if (kind === 'hierarchy moved' && discovery === 2)
          return Promise.resolve([{ id: 'page-1', parent_page_id: null }]);
        return Promise.resolve(ancestors);
      }
      if (sql.startsWith('SELECT id FROM pages') && kind === 'ancestor deleted')
        return Promise.resolve([]);
      if (sql.startsWith('SELECT workspace_id'))
        return Promise.resolve([
          {
            workspace_id: kind === 'teamspace moved' ? 'other' : 'workspace-1',
          },
        ]) as never;
      return Promise.resolve([{ id: 'row' }]) as never;
    });
    await expect(
      f.service.lock(conversation(), f.context, 'user-1'),
    ).rejects.toBeInstanceOf(
      kind.includes('missing') || kind.includes('deleted')
        ? NotFoundException
        : ConflictException,
    );
  });
});
