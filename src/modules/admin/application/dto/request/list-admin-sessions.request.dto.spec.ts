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

  it('rejects a limit above 100', () => {
    expect(errorsOf({ limit: '500' })).toEqual(['limit']);
  });
});
