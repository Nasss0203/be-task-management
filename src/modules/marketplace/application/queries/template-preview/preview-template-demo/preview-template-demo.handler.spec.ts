import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { TemplatePreviewResponseDto } from 'src/modules/template/application/dto/template-preview/template-preview.response.dto';

import { PreviewTemplateDemoHandler } from './preview-template-demo.handler';
import { PreviewTemplateDemoQuery } from './preview-template-demo.query';

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const TEMPLATE = id(1);
const VERSION = id(2);
const CREATOR = id(3);
const STRANGER = id(4);
const B_PUBLIC = id(10);
const B_SECRET = id(11);

const snapshot = () =>
  new TemplatePreviewResponseDto({
    template: { id: TEMPLATE } as any,
    version: { id: VERSION } as any,
    blocks: [B_PUBLIC, B_SECRET].map(
      (blockId) =>
        ({
          id: blockId,
          parent_block_id: null,
          type: PageBlockType.TEXT,
          content: { text: blockId === B_SECRET ? 'PAID SECRET' : 'intro' },
          style_config: {},
          data_config: {},
        }) as any,
    ),
    databases: [],
  });

describe('PreviewTemplateDemoHandler', () => {
  let versions: {
    findById: jest.Mock;
    save: jest.Mock;
    findByIdForUpdate: jest.Mock;
  };
  let templates: { findById: jest.Mock; save: jest.Mock };
  let loader: { loadFrom: jest.Mock };
  let handler: PreviewTemplateDemoHandler;

  beforeEach(() => {
    templates = {
      findById: jest.fn().mockResolvedValue({
        getId: () => TEMPLATE,
        getCreatedBy: () => CREATOR,
        getWorkspaceId: () => id(5),
      }),
      save: jest.fn(),
    };
    versions = {
      findById: jest.fn().mockResolvedValue({
        getId: () => VERSION,
        getTemplateId: () => TEMPLATE,
        isPublished: () => true,
      }),
      findByIdForUpdate: jest.fn(),
      save: jest.fn(),
    };
    loader = { loadFrom: jest.fn().mockImplementation(() => snapshot()) };
    handler = new PreviewTemplateDemoHandler(
      templates as any,
      versions as any,
      { authorize: jest.fn().mockResolvedValue(false) } as any,
      loader as any,
    );
  });

  const run = (config: unknown, userId = CREATOR) =>
    handler.execute(
      new PreviewTemplateDemoQuery(TEMPLATE, userId, VERSION, config as any),
    );

  it('returns the filtered preview for an unsaved LIMITED config', async () => {
    const result = await run({
      schema: 1,
      scope: 'LIMITED',
      block_ids: [B_PUBLIC],
    });

    expect(result.blocks.map((b) => b.id)).toEqual([B_PUBLIC]);
    expect(JSON.stringify(result)).not.toContain('PAID SECRET');
    expect(result.demoScope).toBe('LIMITED');
    expect(result.hiddenContent).toEqual({ blocks: 1, rows: 0 });
  });

  it('has no side effects', async () => {
    await run({ schema: 1, scope: 'LIMITED', block_ids: [B_PUBLIC] });

    expect(templates.save).not.toHaveBeenCalled();
    expect(versions.save).not.toHaveBeenCalled();
    expect(versions.findByIdForUpdate).not.toHaveBeenCalled();
  });

  it('returns the full version for a separate (FULL_VERSION or absent) config', async () => {
    const result = await run(null);
    expect(result.demoScope).toBe('FULL_VERSION');
    expect(result.blocks).toHaveLength(2);
  });

  it('is creator-only', async () => {
    await expect(run(null, STRANGER)).rejects.toThrow(ForbiddenException);
    expect(loader.loadFrom).not.toHaveBeenCalled();
  });

  it('rejects invalid configs and ids outside the snapshot', async () => {
    await expect(
      run({ schema: 1, scope: 'LIMITED', block_ids: [] }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      run({ schema: 1, scope: 'LIMITED', block_ids: [id(99)] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects versions of other templates and unpublished versions', async () => {
    versions.findById.mockResolvedValueOnce({
      getId: () => VERSION,
      getTemplateId: () => id(77),
      isPublished: () => true,
    });
    await expect(run(null)).rejects.toThrow(NotFoundException);

    versions.findById.mockResolvedValueOnce({
      getId: () => VERSION,
      getTemplateId: () => TEMPLATE,
      isPublished: () => false,
    });
    await expect(run(null)).rejects.toThrow(BadRequestException);
  });
});
