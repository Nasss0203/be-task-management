import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListAdminActionsRequestDto } from './list-admin-actions.request.dto';

function errorsOf(query: Record<string, unknown>) {
  return validateSync(plainToInstance(ListAdminActionsRequestDto, query)).map(
    (error) => error.property,
  );
}

describe('ListAdminActionsRequestDto', () => {
  it('accepts known actions and target types', () => {
    expect(
      errorsOf({
        page: '1',
        limit: '20',
        action: 'BILLING_PLAN_UPDATED',
        targetType: 'BILLING_PLAN',
        targetId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      }),
    ).toEqual([]);
  });

  it('rejects unknown actions and target types', () => {
    expect(errorsOf({ action: 'USER_DELETED', targetType: 'INVOICE' })).toEqual(
      ['targetType', 'action'],
    );
  });
});
