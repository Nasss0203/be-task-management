import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListAdminTemplatesRequestDto } from './list-admin-templates.request.dto';

function errorsOf(query: Record<string, unknown>) {
  return validateSync(plainToInstance(ListAdminTemplatesRequestDto, query)).map(
    (error) => error.property,
  );
}

describe('ListAdminTemplatesRequestDto', () => {
  it('accepts valid filters', () => {
    expect(
      errorsOf({
        status: 'PUBLISHED',
        offerType: 'PAID',
        categoryId: '7b0c5f0e-1d2a-4b3c-8d4e-5f6a7b8c9d0e',
      }),
    ).toEqual([]);
  });

  it('rejects unknown status and offer type', () => {
    expect(errorsOf({ status: 'SUSPENDED', offerType: 'TRIAL' })).toEqual([
      'status',
      'offerType',
    ]);
  });

  it('rejects a category id that is not a uuid', () => {
    expect(errorsOf({ categoryId: 'education' })).toEqual(['categoryId']);
  });
});
