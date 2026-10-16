/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-argument */
import type { IAuth } from 'src/types/auth';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { UseTemplateCommand } from '../../../application/commands/page-template/use-template/use-template.command';
import type { UseTemplateHandler } from '../../../application/commands/page-template/use-template/use-template.handler';
import { UseTemplateRequest } from '../requests/use-template.request';
import { TemplateController } from './template.controller';

describe('TemplateController useTemplate endpoint Regression Tests', () => {
  let controller: TemplateController;
  let useTemplateHandler: jest.Mocked<UseTemplateHandler>;

  beforeEach(() => {
    useTemplateHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UseTemplateHandler>;

    controller = new TemplateController(
      null as unknown as any, // getTemplateVersionThumbnailHandler
      useTemplateHandler,
      null as unknown as any, // createPageTemplateHandler
      null as unknown as any, // publishTemplateVersionHandler
      null as unknown as any, // getTemplatePreviewHandler
      null as unknown as any, // listPageTemplatesHandler
      null as unknown as any, // getPageTemplateHandler
      null as unknown as any, // listTemplateVersionsHandler
      null as unknown as any, // updatePageTemplateHandler
      null as unknown as any, // archivePageTemplateHandler
      null as unknown as any, // restorePageTemplateHandler
      null as unknown as any, // createTemplateVersionHandler
    );
  });

  it('delegates useTemplate to UseTemplateHandler with correct command parameters and returns pageId', async () => {
    const templateId = 'template-uuid-1';
    const versionId = 'version-uuid-1';
    const workspaceId = 'destination-workspace-uuid';
    const auth: IAuth = {
      id: 'user-uuid-1',
      username: 'testuser',
      email: 'user@example.com',
      systemRole: SystemRole.USER,
    };

    const request: UseTemplateRequest = {
      workspace_id: workspaceId,
    };

    useTemplateHandler.execute.mockResolvedValue({
      pageId: 'newly-created-page-uuid',
    });

    const result = await controller.useTemplate(
      templateId,
      versionId,
      request,
      auth,
    );

    expect(useTemplateHandler.execute).toHaveBeenCalledWith(
      new UseTemplateCommand(templateId, versionId, workspaceId, auth.id),
    );
    expect(result).toEqual({ pageId: 'newly-created-page-uuid' });
  });
});
