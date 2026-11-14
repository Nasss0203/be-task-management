import { TypeOrmPageAccessReviewerReader } from './typeorm-page-access-reviewer.reader';

describe('TypeOrmPageAccessReviewerReader workspace owners', () => {
  const reviewersFor = async (teamspaceId: string | null) => {
    const query = jest.fn((sql: string) => {
      if (sql.includes('FROM pages') && sql.includes('LIMIT 1')) {
        return Promise.resolve([
          { id: 'page', workspace_id: 'workspace', teamspace_id: teamspaceId },
        ]);
      }
      if (sql.includes('FROM teamspace_members')) {
        return Promise.resolve([{ user_id: 'teamspace-owner' }]);
      }
      if (sql.includes("role_name = 'OWNER'")) {
        return Promise.resolve([{ user_id: 'workspace-owner' }]);
      }
      return Promise.resolve([]);
    });
    const reader = new TypeOrmPageAccessReviewerReader({ query } as never, {
      findByPageId: jest.fn().mockResolvedValue(null),
    });

    return reader.findReviewerIds('page');
  };

  it('asks only teamspace owners for a page inside a teamspace', async () => {
    await expect(reviewersFor('teamspace')).resolves.toEqual([
      'teamspace-owner',
    ]);
  });

  it('asks workspace owners for a shared page', async () => {
    await expect(reviewersFor(null)).resolves.toEqual(['workspace-owner']);
  });
});
