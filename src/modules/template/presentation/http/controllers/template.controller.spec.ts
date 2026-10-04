import type { IAuth } from 'src/types/auth';
import type { CreatePageTemplateHandler } from '../../../application/commands/page-template/create-page-template/create-page-template.handler';
import type { UseTemplateHandler } from '../../../application/commands/page-template/use-template/use-template.handler';
import type { PublishTemplateVersionHandler } from '../../../application/commands/template-version/publish-template-version/publish-template-version.handler';
import type { GetPageTemplateHandler } from '../../../application/queries/page-template/get-page-template/get-page-template.handler';
import type { ListPageTemplatesHandler } from '../../../application/queries/page-template/list-page-templates/list-page-templates.handler';
import type { GetTemplatePreviewHandler } from '../../../application/queries/template-preview/get-template-preview/get-template-preview.handler';
import type { ListTemplateVersionsHandler } from '../../../application/queries/template-version/list-template-versions/list-template-versions.handler';
import { TemplateController } from './template.controller';

describe('TemplateController read API wiring', () => {
  const getTemplateExecute = jest.fn();
  const listVersionsExecute = jest.fn();
  let controller: TemplateController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TemplateController(
      { execute: jest.fn() } as unknown as UseTemplateHandler,
      { execute: jest.fn() } as unknown as CreatePageTemplateHandler,
      { execute: jest.fn() } as unknown as PublishTemplateVersionHandler,
      { execute: jest.fn() } as unknown as GetTemplatePreviewHandler,
      { execute: jest.fn() } as unknown as ListPageTemplatesHandler,
      { execute: getTemplateExecute } as unknown as GetPageTemplateHandler,
      {
        execute: listVersionsExecute,
      } as unknown as ListTemplateVersionsHandler,
    );
  });

  it('dispatches GET template detail with the authenticated user', async () => {
    getTemplateExecute.mockResolvedValue({ id: 'template-1' });

    await expect(
      controller.getTemplate('template-1', { id: 'user-1' } as IAuth),
    ).resolves.toEqual({ id: 'template-1' });
    expect(getTemplateExecute).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: 'template-1', userId: 'user-1' }),
    );
  });

  it('dispatches GET template versions with the authenticated user', async () => {
    listVersionsExecute.mockResolvedValue({ items: [] });

    await expect(
      controller.listVersions('template-1', { id: 'user-1' } as IAuth),
    ).resolves.toEqual({ items: [] });
    expect(listVersionsExecute).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: 'template-1', userId: 'user-1' }),
    );
  });
});
