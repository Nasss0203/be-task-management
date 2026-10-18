import { ConflictException } from '@nestjs/common';

import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PublishTemplateVersionCommand } from './publish-template-version.command';
import { PublishTemplateVersionHandler } from './publish-template-version.handler';

describe('PublishTemplateVersionHandler listing pin', () => {
  it('publishes only Version 2 and leaves Version 1 and listing pin unchanged', async () => {
    const templateId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';
    const soldVersion = TemplateVersion.create({
      templateId,
      versionNumber: 1,
      createdBy: userId,
    });
    soldVersion.publish();
    const demoVersion = TemplateVersion.create({
      templateId,
      versionNumber: 2,
      createdBy: userId,
    });
    const listing = { publishedVersionId: soldVersion.getId() };
    const versionRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(demoVersion),
      save: jest.fn().mockImplementation(async (version) => version),
    };
    const handler = new PublishTemplateVersionHandler(
      {
        findById: jest
          .fn()
          .mockResolvedValue({
            getCreatedBy: () => userId,
            getWorkspaceId: () => 'workspace',
          }),
      } as never,
      versionRepository as never,
      {
        runInTransaction: jest.fn().mockImplementation((work) => work({})),
      } as never,
      { authorize: jest.fn().mockResolvedValue(true) } as never,
    );

    await handler.execute(
      new PublishTemplateVersionCommand(
        templateId,
        demoVersion.getId(),
        userId,
      ),
    );

    expect(demoVersion.isPublished()).toBe(true);
    expect(soldVersion.isPublished()).toBe(true);
    expect(listing.publishedVersionId).toBe(soldVersion.getId());
    expect(versionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('answers 409 when the version is already published, without saving', async () => {
    const templateId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';
    const published = TemplateVersion.create({
      templateId,
      versionNumber: 1,
      createdBy: userId,
    });
    published.publish();
    const publishedAt = published.getPublishedAt();
    const versionRepository = {
      findByIdForUpdate: jest.fn().mockResolvedValue(published),
      save: jest.fn(),
    };
    const handler = new PublishTemplateVersionHandler(
      {
        findById: jest.fn().mockResolvedValue({
          getCreatedBy: () => userId,
          getWorkspaceId: () => 'workspace',
        }),
      } as never,
      versionRepository as never,
      {
        runInTransaction: jest.fn().mockImplementation((work) => work({})),
      } as never,
      { authorize: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(
      handler.execute(
        new PublishTemplateVersionCommand(templateId, published.getId(), userId),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(versionRepository.save).not.toHaveBeenCalled();
    expect(published.getPublishedAt()).toBe(publishedAt);
  });
});
