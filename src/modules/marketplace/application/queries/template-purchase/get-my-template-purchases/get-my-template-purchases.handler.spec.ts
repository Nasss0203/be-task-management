import { BadRequestException } from '@nestjs/common';

import { decodeTemplateListCursor } from '../../../../../template/application/queries/page-template/list-page-templates/template-list-cursor.helper';
import { TemplatePurchaseStatus } from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';
import { GetMyTemplatePurchasesHandler } from './get-my-template-purchases.handler';
import { GetMyTemplatePurchasesQuery } from './get-my-template-purchases.query';

describe('GetMyTemplatePurchasesHandler', () => {
  const row = {
    id: '22222222-2222-4222-8222-222222222222',
    orderCode: 'TP00000000000000000000000000000002',
    templateId: 'template-1',
    templateName: 'E2E Template',
    templateIcon: null,
    versionNumber: 3,
    amount: 50000,
    currency: 'VND',
    status: TemplatePurchaseStatus.PAID,
    createdAt: new Date('2026-10-18T09:00:00Z'),
    paidAt: new Date('2026-10-18T09:02:00Z'),
  };
  const setup = (items = [row], hasNextPage = false) => {
    const repository = {
      findHistoryByBuyer: jest.fn().mockResolvedValue({ items, hasNextPage }),
      save: jest.fn(),
      create: jest.fn(),
    };
    return {
      repository,
      handler: new GetMyTemplatePurchasesHandler(
        repository as unknown as TemplatePurchaseRepository,
      ),
    };
  };

  it('reads only the signed-in buyer and never writes', async () => {
    const { handler, repository } = setup();

    const result = await handler.execute(
      new GetMyTemplatePurchasesQuery('buyer-1'),
    );

    expect(repository.findHistoryByBuyer).toHaveBeenCalledWith({
      buyerId: 'buyer-1',
      limit: 20,
      cursor: undefined,
    });
    expect(result).toEqual({ items: [row], nextCursor: null });
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('pages with the last purchase as cursor', async () => {
    const { handler, repository } = setup([row], true);

    const first = await handler.execute(
      new GetMyTemplatePurchasesQuery('buyer-1', undefined, 1),
    );
    expect(decodeTemplateListCursor(first.nextCursor!)).toEqual({
      createdAt: row.createdAt,
      id: row.id,
    });

    await handler.execute(
      new GetMyTemplatePurchasesQuery('buyer-1', first.nextCursor!, 1),
    );
    expect(repository.findHistoryByBuyer).toHaveBeenLastCalledWith({
      buyerId: 'buyer-1',
      limit: 1,
      cursor: { createdAt: row.createdAt, id: row.id },
    });
  });

  it.each([0, 101, 1.5])('rejects limit %s', async (limit) => {
    await expect(
      setup().handler.execute(
        new GetMyTemplatePurchasesQuery('buyer-1', undefined, limit),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
