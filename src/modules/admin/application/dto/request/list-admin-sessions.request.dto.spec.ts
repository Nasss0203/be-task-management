import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListAdminSessionsRequestDto } from './list-admin-sessions.request.dto';

function errorsOf(query: Record<string, unknown>) {
  return validateSync(plainToInstance(ListAdminSessionsRequestDto, query)).map(
    (error) => error.property,
  );
}

describe('ListAdminSessionsRequestDto', () => {
  it('accepts a known system role', () => {
    expect(
      errorsOf({ systemRole: 'SUPER_ADMIN', page: '2', limit: '50' }),
    ).toEqual([]);
  });

  it('rejects an unknown system role', () => {
    expect(errorsOf({ systemRole: 'ROOT' })).toEqual(['systemRole']);
  });

  it('accepts an optional user id', () => {
    expect(
      errorsOf({ userId: 'ecf5ae0b-0833-4bbe-b01a-71dc38b91b8f' }),
    ).toEqual([]);
    expect(errorsOf({})).toEqual([]);
  });

  it('rejects a user id that is not a UUID', () => {
    expect(errorsOf({ userId: 'abc' })).toEqual(['userId']);
  });

  it('rejects a limit above 100', () => {
    expect(errorsOf({ limit: '500' })).toEqual(['limit']);
  });
});
