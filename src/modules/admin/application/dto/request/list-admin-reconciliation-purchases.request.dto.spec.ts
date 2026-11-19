import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { ListAdminReconciliationPurchasesRequestDto } from './list-admin-reconciliation-purchases.request.dto';

function parse(query: Record<string, unknown>) {
  const dto = plainToInstance(
    ListAdminReconciliationPurchasesRequestDto,
    query,
  );

  return { dto, errors: validateSync(dto).map((error) => error.property) };
}

describe('ListAdminReconciliationPurchasesRequestDto', () => {
  it('defaults to purchases awaiting reconciliation', () => {
    const { dto, errors } = parse({});

    expect(errors).toEqual([]);
    expect(dto.status).toBe('RECONCILIATION_REQUIRED');
  });

  it('accepts refunded purchases', () => {
    expect(parse({ status: 'REFUNDED' }).errors).toEqual([]);
  });

  it.each(['PAID', 'PENDING', 'anything'])('rejects status %s', (status) => {
    expect(parse({ status }).errors).toEqual(['status']);
  });
});
