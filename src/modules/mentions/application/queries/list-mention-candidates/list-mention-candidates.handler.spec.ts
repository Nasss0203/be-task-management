import { MentionCandidateService } from '../../services/mention-candidate.service';
import { ListMentionCandidatesHandler } from './list-mention-candidates.handler';
import { ListMentionCandidatesQuery } from './list-mention-candidates.query';

const PAGE = 'page-1';
const REQUESTER = 'user-a';

const candidate = (id: string) => ({
  id,
  username: id,
  email: `${id}@test.local`,
  avatarUrl: null,
});

describe('ListMentionCandidatesHandler', () => {
  const findAllowed = jest.fn();
  const handler = new ListMentionCandidatesHandler({
    findAllowed,
  } as unknown as MentionCandidateService);

  beforeEach(() => findAllowed.mockReset());

  it('excludes the requester from the candidates', async () => {
    findAllowed.mockResolvedValue([candidate('user-b'), candidate('user-c')]);

    const result = await handler.execute(
      new ListMentionCandidatesQuery(PAGE, '  user  ', REQUESTER),
    );

    expect(findAllowed).toHaveBeenCalledWith(PAGE, {
      query: 'user',
      excludeUserId: REQUESTER,
      limit: 20,
    });
    expect(result.map((user) => user.id)).toEqual(['user-b', 'user-c']);
  });

  it('returns an empty list when the requester is the only member', async () => {
    findAllowed.mockResolvedValue([]);

    const result = await handler.execute(
      new ListMentionCandidatesQuery(PAGE, '', REQUESTER),
    );

    expect(findAllowed).toHaveBeenCalledWith(PAGE, {
      query: undefined,
      excludeUserId: REQUESTER,
      limit: 20,
    });
    expect(result).toEqual([]);
  });
});
