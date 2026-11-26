import { BadRequestException } from '@nestjs/common';

import { parsePageSearchFilters } from './page-search-filters';

const TEAMSPACE_ID = '7b0a3c55-1c1d-4a53-9a4e-2f8f0c6e1a10';
const USER_ID = 'c2a1f6de-9b2e-4f5c-8a71-0e4d3b2a1c90';

describe('parsePageSearchFilters', () => {
  it('returns no filters when nothing is sent', () => {
    expect(parsePageSearchFilters({})).toEqual({});
  });

  it('reads creator, teamspace and edited window', () => {
    expect(
      parsePageSearchFilters({
        createdBy: USER_ID,
        teamspaceId: TEAMSPACE_ID,
        editedWithin: '7d',
      }),
    ).toEqual({
      createdBy: USER_ID,
      teamspaceId: TEAMSPACE_ID,
      editedWithinDays: 7,
    });
  });

  it('maps private to pages outside any teamspace', () => {
    expect(parsePageSearchFilters({ teamspaceId: 'private' })).toEqual({
      teamspaceId: null,
    });
  });

  it.each([
    [{ createdBy: 'abc' }, 'createdBy'],
    [{ createdBy: [USER_ID, USER_ID] }, 'createdBy'],
    [{ teamspaceId: 'abc' }, 'teamspaceId'],
    [{ editedWithin: '2y' }, 'editedWithin'],
  ])('rejects %j naming the parameter', (raw, name) => {
    expect(() => parsePageSearchFilters(raw)).toThrow(BadRequestException);
    expect(() => parsePageSearchFilters(raw)).toThrow(name);
  });
});
