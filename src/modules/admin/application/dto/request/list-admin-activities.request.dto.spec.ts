import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListAdminActivitiesRequestDto } from './list-admin-activities.request.dto';

function errorsOf(query: Record<string, unknown>) {
  return validateSync(
    plainToInstance(ListAdminActivitiesRequestDto, query),
  ).map((error) => error.property);
}

describe('ListAdminActivitiesRequestDto', () => {
  it('accepts known filters and ISO dates', () => {
    expect(
      errorsOf({
        page: '2',
        limit: '50',
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-18',
        workspaceId: '0f8fad5b-d9cb-469f-a165-70867728950e',
        entityType: 'PAGE',
        action: 'PAGE_CREATED',
      }),
    ).toEqual([]);
  });

  it('rejects unknown entity types and actions', () => {
    expect(errorsOf({ entityType: 'INVOICE', action: 'LOGIN' })).toEqual([
      'entityType',
      'action',
    ]);
  });

  it('rejects malformed dates and ids', () => {
    expect(errorsOf({ from: 'yesterday', actorId: 'abc' })).toEqual([
      'from',
      'actorId',
    ]);
  });
});
