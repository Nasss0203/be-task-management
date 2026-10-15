import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTemplateVersionCommand } from './create-template-version.command';
import { CreateTemplateVersionHandler } from './create-template-version.handler';
import { validate } from 'class-validator';
import { CreateTemplateVersionRequest } from '../../../../presentation/http/requests/create-template-version.request';

describe('CreateTemplateVersionHandler source page', () => {
  it('accepts an omitted source_page_id and rejects a malformed UUID', async () => {
    expect(await validate(new CreateTemplateVersionRequest())).toHaveLength(0);
    const request = new CreateTemplateVersionRequest();
    request.source_page_id = 'not-a-uuid';
    expect(await validate(request)).toHaveLength(1);
  });
  const templateId = '11111111-1111-4111-8111-111111111111';
  const originalPageId = '22222222-2222-4222-8222-222222222222';
  const demoPageId = '33333333-3333-4333-8333-333333333333';
  const workspaceId = '44444444-4444-4444-8444-444444444444';
  const userId = '55555555-5555-4555-8555-555555555555';

  function setup(pageWorkspaceId = workspaceId) {
    const template = {
      getCreatedBy: () => userId,
      getWorkspaceId: () => workspaceId,
      getSourcePageId: () => originalPageId,
      ensureCanCreateVersion: jest.fn(),
    };
    const pageTemplateRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(template),
    };
    const templateVersionRepository = {
      findLatestByTemplateId: jest.fn().mockResolvedValue(null),
      getNextVersionNumber: jest.fn().mockResolvedValue(2),
      create: jest.fn().mockImplementation(async (version) => version),
    };
    const pageSnapshotReader = {
      getPageSnapshot: jest.fn().mockResolvedValue({
        page: { workspaceId: pageWorkspaceId },
        blocks: [],
      }),
    };
    const authorizationService = {
      authorize: jest.fn().mockResolvedValue(true),
    };
    const contentSnapshotService = {
      prepare: jest.fn().mockResolvedValue({ blocks: [], databases: [] }),
      persist: jest.fn().mockResolvedValue(undefined),
    };
    const unitOfWork = {
      runInTransaction: jest.fn().mockImplementation((work) => work({})),
    };
    const thumbnailQueue = {
      enqueueGenerateThumbnail: jest.fn().mockResolvedValue(undefined),
    };
    const fingerprintService = {
      compute: jest.fn().mockReturnValue('new-hash'),
    };
    const handler = new CreateTemplateVersionHandler(
      pageTemplateRepository as never,
      templateVersionRepository as never,
      unitOfWork as never,
      thumbnailQueue as never,
      pageSnapshotReader as never,
      authorizationService as never,
      contentSnapshotService as never,
      fingerprintService as never,
    );
    return {
      handler,
      template,
      pageSnapshotReader,
      authorizationService,
      contentSnapshotService,
      templateVersionRepository,
      thumbnailQueue,
    };
  }

  it('uses the original source when no override is provided', async () => {
    const s = setup();
    await s.handler.execute(
      new CreateTemplateVersionCommand(templateId, userId),
    );
    expect(s.pageSnapshotReader.getPageSnapshot).toHaveBeenCalledWith(
      originalPageId,
      expect.anything(),
    );
    expect(s.template.getSourcePageId()).toBe(originalPageId);
  });

  it('snapshots the chosen demo page without changing the template or old version', async () => {
    const s = setup();
    await s.handler.execute(
      new CreateTemplateVersionCommand(templateId, userId, demoPageId),
    );
    expect(s.pageSnapshotReader.getPageSnapshot).toHaveBeenCalledWith(
      demoPageId,
      expect.anything(),
    );
    expect(s.template.getSourcePageId()).toBe(originalPageId);
    expect(s.templateVersionRepository.create).toHaveBeenCalledTimes(1);
    expect(s.contentSnapshotService.persist).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing page', async () => {
    const s = setup();
    s.pageSnapshotReader.getPageSnapshot.mockResolvedValue(null);
    await expect(
      s.handler.execute(
        new CreateTemplateVersionCommand(templateId, userId, demoPageId),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(s.templateVersionRepository.create).not.toHaveBeenCalled();
  });

  it('rejects a page outside the template workspace', async () => {
    const s = setup('another-workspace');
    await expect(
      s.handler.execute(
        new CreateTemplateVersionCommand(templateId, userId, demoPageId),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it.each([2, 3])(
    'rejects when authorization check %i fails',
    async (check) => {
      const s = setup();
      s.authorizationService.authorize.mockImplementation(async () => {
        const calls = s.authorizationService.authorize.mock.calls.length;
        return calls !== check;
      });
      await expect(
        s.handler.execute(
          new CreateTemplateVersionCommand(templateId, userId, demoPageId),
        ),
      ).rejects.toThrow(ForbiddenException);
    },
  );

  it('does not persist a version when snapshot preparation fails', async () => {
    const s = setup();
    s.contentSnapshotService.prepare.mockRejectedValue(
      new ForbiddenException(),
    );
    await expect(
      s.handler.execute(
        new CreateTemplateVersionCommand(templateId, userId, demoPageId),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(s.templateVersionRepository.create).not.toHaveBeenCalled();
    expect(s.thumbnailQueue.enqueueGenerateThumbnail).not.toHaveBeenCalled();
  });
});
