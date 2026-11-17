import {
  AdminTemplateOfferFilter,
  AdminTemplateStatusFilter,
  type AdminTemplateReader,
} from '../../ports/admin-template-reader.port';
import { ListAdminTemplatesHandler } from './list-admin-templates.handler';
import { ListAdminTemplatesQuery } from './list-admin-templates.query';

function createHandler(total: number) {
  const listTemplates = jest.fn().mockResolvedValue({
    items: [],
    total,
    page: 1,
    limit: 10,
  });
  const reader = { listTemplates } as unknown as AdminTemplateReader;

  return { handler: new ListAdminTemplatesHandler(reader), listTemplates };
}

describe('ListAdminTemplatesHandler', () => {
  it('passes search, status, offer type and category to the reader', async () => {
    const { handler, listTemplates } = createHandler(0);
    const categoryId = '7b0c5f0e-1d2a-4b3c-8d4e-5f6a7b8c9d0e';

    await handler.execute(
      new ListAdminTemplatesQuery(
        2,
        10,
        'creator@',
        AdminTemplateStatusFilter.PUBLISHED,
        AdminTemplateOfferFilter.PAID,
        categoryId,
      ),
    );

    expect(listTemplates).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      search: 'creator@',
      status: AdminTemplateStatusFilter.PUBLISHED,
      offerType: AdminTemplateOfferFilter.PAID,
      categoryId,
    });
  });

  it('lists every listing when no filter is given', async () => {
    const { handler, listTemplates } = createHandler(0);

    await handler.execute(new ListAdminTemplatesQuery(1, 20));

    expect(listTemplates).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: AdminTemplateStatusFilter.ALL,
      offerType: AdminTemplateOfferFilter.ALL,
      categoryId: undefined,
    });
  });

  it('computes total pages from the filtered total', async () => {
    const { handler } = createHandler(21);

    const result = await handler.execute(new ListAdminTemplatesQuery(1, 10));

    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(21);
  });
});
