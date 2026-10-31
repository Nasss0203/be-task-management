import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { PageBlockFormService } from './page-block-form.service';

describe('PageBlockFormService.assertColumnFree', () => {
  const service = new PageBlockFormService(
    {
      findActiveChildren: jest.fn().mockResolvedValue([
        {
          getType: () => PageBlockType.FORM_FIELD,
          getDataConfig: () => ({ property_id: 'skills' }),
        },
      ]),
    } as unknown as PageBlockRepository,
    {} as PageRepository,
    {} as DatabaseRepository,
    {} as AuthorizationService,
  );
  const parent = { getId: () => 'section' } as PageBlock;

  it('refuses a second question on the same column', async () => {
    await expect(
      service.assertColumnFree(parent, { property_id: 'skills' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts a free column', async () => {
    await expect(
      service.assertColumnFree(parent, { property_id: 'email' }),
    ).resolves.toBeUndefined();
  });
});

describe('PageBlockFormService.assertValidSectionForm', () => {
  const setup = (options?: { allowed?: boolean; otherWorkspace?: boolean }) => {
    const pages: Record<string, string> = {
      'form-page': 'workspace',
      'hr-page': options?.otherWorkspace ? 'other' : 'workspace',
    };
    const authorize = jest.fn().mockResolvedValue(options?.allowed ?? true);
    const service = new PageBlockFormService(
      {
        findActiveChildren: jest.fn().mockResolvedValue([]),
      } as unknown as PageBlockRepository,
      {
        findById: jest.fn((id: string) =>
          Promise.resolve({ getWorkspaceId: () => pages[id] }),
        ),
      } as unknown as PageRepository,
      {
        findById: jest.fn(() =>
          Promise.resolve({ getPageId: () => 'hr-page' }),
        ),
      } as unknown as DatabaseRepository,
      { authorize } as unknown as AuthorizationService,
    );

    return { service, authorize };
  };

  const link = (current: string | null = null) => ({
    pageId: 'form-page',
    sectionId: 'section',
    current: current ? { form: { database_id: current } } : null,
    next: { form: { database_id: 'db', submit_label: 'Send' } },
    userId: 'hr',
  });

  it('links a database on another page of the workspace', async () => {
    const { service, authorize } = setup();

    await expect(
      service.assertValidSectionForm(link()),
    ).resolves.toBeUndefined();
    expect(authorize).toHaveBeenCalledWith({
      userId: 'hr',
      permissions: ['page_block.update'],
      target: { type: 'page', id: 'hr-page' },
    });
  });

  it('refuses a database of another workspace', async () => {
    const { service } = setup({ otherWorkspace: true });

    await expect(
      service.assertValidSectionForm(link()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses without edit access to the database page', async () => {
    const { service } = setup({ allowed: false });

    await expect(
      service.assertValidSectionForm(link()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not ask for that access again when the link stays the same', async () => {
    const { service, authorize } = setup({ allowed: false });

    await expect(
      service.assertValidSectionForm(link('db')),
    ).resolves.toBeUndefined();
    expect(authorize).not.toHaveBeenCalled();
  });
});
