import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListAdminPublishedSitesRequestDto } from './list-admin-published-sites.request.dto';

function errorsOf(query: Record<string, unknown>) {
  return validateSync(
    plainToInstance(ListAdminPublishedSitesRequestDto, query),
  ).map((error) => error.property);
}

describe('ListAdminPublishedSitesRequestDto', () => {
  it('accepts a known status', () => {
    expect(errorsOf({ status: 'DISABLED', page: '2', limit: '10' })).toEqual(
      [],
    );
  });

  it('rejects an unknown status', () => {
    expect(errorsOf({ status: 'BLOCKED' })).toEqual(['status']);
  });

  it('rejects a limit above 100', () => {
    expect(errorsOf({ limit: '500' })).toEqual(['limit']);
  });
});
