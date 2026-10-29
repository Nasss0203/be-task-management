import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { PageBlockRowScopeService } from './page-block-row-scope.service';

describe('PageBlockRowScopeService', () => {
  const rows = {
    findById: jest.fn((id: string) =>
      Promise.resolve(id === 'row-1' ? { getDatabaseId: () => 'db-1' } : null),
    ),
  };
  const databases = {
    findById: jest.fn(() => Promise.resolve({ getPageId: () => 'page-1' })),
  };
  const service = new PageBlockRowScopeService(
    rows as never,
    databases as never,
  );

  it('accepts a task of a database on the same page', async () => {
    await expect(
      service.assertRowOnPage('row-1', 'page-1'),
    ).resolves.toBeUndefined();
  });

  it('rejects a task on another page and a missing task', async () => {
    await expect(
      service.assertRowOnPage('row-1', 'page-2'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.assertRowOnPage('missing', 'page-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps databases out of task content only', () => {
    expect(() =>
      service.assertTypeAllowed('row-1', PageBlockType.DATABASE_VIEW),
    ).toThrow(BadRequestException);
    expect(() =>
      service.assertTypeAllowed(null, PageBlockType.DATABASE_VIEW),
    ).not.toThrow();
    expect(() =>
      service.assertTypeAllowed('row-1', PageBlockType.TEXT),
    ).not.toThrow();
  });
});
