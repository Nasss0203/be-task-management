import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PageBlock } from 'src/modules/content/domain/entities/page-block.entity';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { DatabaseProperty } from 'src/modules/database/domain/aggregates/database/database-property.entity';
import { PropertyType } from 'src/modules/database/domain/enums/property-type.enum';
import type { DatabaseRepository } from 'src/modules/database/domain/repositories/database.repository';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import {
  assertAnswerKeyValue,
  PageBlockFormService,
} from './page-block-form.service';

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

    await expect(service.assertValidSectionForm(link())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses without edit access to the database page', async () => {
    const { service } = setup({ allowed: false });

    await expect(service.assertValidSectionForm(link())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not ask for that access again when the link stays the same', async () => {
    const { service, authorize } = setup({ allowed: false });

    await expect(
      service.assertValidSectionForm(link('db')),
    ).resolves.toBeUndefined();
    expect(authorize).not.toHaveBeenCalled();
  });
});

describe('PageBlockFormService quiz config', () => {
  const property = (id: string, type: PropertyType) => ({
    getId: () => id,
    getType: () => type,
    getOptions: () => [],
  });

  const setup = (options?: { databasePage?: string; questionOn?: string }) =>
    new PageBlockFormService(
      {
        findActiveChildren: jest.fn().mockResolvedValue(
          options?.questionOn
            ? [
                {
                  getType: () => PageBlockType.FORM_FIELD,
                  getDataConfig: () => ({ property_id: options.questionOn }),
                },
              ]
            : [],
        ),
      } as unknown as PageBlockRepository,
      {
        findById: jest.fn(() =>
          Promise.resolve({ getWorkspaceId: () => 'workspace' }),
        ),
      } as unknown as PageRepository,
      {
        findById: jest.fn(() =>
          Promise.resolve({
            getPageId: () => options?.databasePage ?? 'answers-page',
            getProperties: () => [
              property('score', PropertyType.NUMBER),
              property('name', PropertyType.TEXT),
            ],
          }),
        ),
      } as unknown as DatabaseRepository,
      {
        authorize: jest.fn().mockResolvedValue(true),
      } as unknown as AuthorizationService,
    );

  const save = (quiz: Record<string, unknown>, form = true) => ({
    pageId: 'form-page',
    sectionId: 'section',
    current: { form: { database_id: 'db' } },
    next: form ? { form: { database_id: 'db' }, quiz } : { quiz },
    userId: 'teacher',
  });

  const valid = {
    show_result: 'score',
    max_attempts: 2,
    score_property_id: 'score',
  };

  it('accepts a valid quiz', async () => {
    await expect(
      setup().assertValidSectionForm(save(valid)),
    ).resolves.toBeUndefined();
  });

  it.each([
    ['an unknown show_result', { ...valid, show_result: 'all' }],
    ['zero attempts', { ...valid, max_attempts: 0 }],
    ['fractional attempts', { ...valid, max_attempts: 1.5 }],
    [
      'a score column that is not a number',
      { ...valid, score_property_id: 'name' },
    ],
    ['a missing score column', { ...valid, score_property_id: undefined }],
  ])('refuses %s', async (_, quiz) => {
    await expect(
      setup().assertValidSectionForm(save(quiz)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a database on the form page', async () => {
    await expect(
      setup({ databasePage: 'form-page' }).assertValidSectionForm(save(valid)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses when the score column is already a question', async () => {
    await expect(
      setup({ questionOn: 'score' }).assertValidSectionForm(save(valid)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a quiz on a section that is not a form', async () => {
    await expect(
      setup().assertValidSectionForm(save(valid, false)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('assertAnswerKeyValue', () => {
  const property = (type: PropertyType) =>
    ({
      getType: () => type,
      getOptions: () => [{ getId: () => 'a' }, { getId: () => 'b' }],
    }) as unknown as DatabaseProperty;

  it.each([
    [PropertyType.SELECT, 'a'],
    [PropertyType.MULTI_SELECT, ['a', 'b']],
    [PropertyType.CHECKBOX, false],
    [PropertyType.NUMBER, 42],
    [PropertyType.TEXT, 'Hà Nội'],
  ])('accepts a %s answer', (type, value) => {
    expect(() => assertAnswerKeyValue(property(type), value)).not.toThrow();
  });

  it.each([
    [PropertyType.SELECT, 'missing'],
    [PropertyType.MULTI_SELECT, ['a', 'a']],
    [PropertyType.MULTI_SELECT, []],
    [PropertyType.NUMBER, '42'],
    [PropertyType.TEXT, '   '],
    [PropertyType.DATE, '2026-01-01'],
  ])('refuses a %s answer of %j', (type, value) => {
    expect(() => assertAnswerKeyValue(property(type), value)).toThrow(
      BadRequestException,
    );
  });
});
