import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { PublishedSite } from '../../../../domain/entities/published-site.entity';
import { PagePublicationType } from '../../../../domain/enums/page-publication-type.enum';
import { PagePublicationResponseDto } from '../../../dto/page-publication/response/page-publication.response.dto';
import { UpdatePagePublicationSettingsCommand } from './update-page-publication-settings.command';
import { UpdatePagePublicationSettingsHandler } from './update-page-publication-settings.handler';

describe('UpdatePagePublicationSettingsHandler SEO', () => {
  const at = new Date('2026-11-24T00:00:00.000Z');
  const publication = {
    getSiteId: () => 'site-1',
    getPublicationType: () => PagePublicationType.DIRECT,
    getUnpublishedAt: () => null,
  };
  let site: PublishedSite;
  let sites: {
    findById: jest.Mock;
    findByIdForUpdate: jest.Mock;
    save: jest.Mock;
  };
  let authorize: jest.Mock;
  let handler: UpdatePagePublicationSettingsHandler;

  const restore = (disabledAt: Date | null) =>
    PublishedSite.restore({
      id: 'site-1',
      workspaceId: 'workspace-1',
      rootPageId: 'root-1',
      subdomain: 'docs',
      createdBy: 'user-1',
      createdAt: at,
      updatedAt: at,
      disabledAt,
      allowUpdates: true,
    });

  const command = (seo: Record<string, unknown>) =>
    new UpdatePagePublicationSettingsCommand(
      'user-1',
      'page-1',
      'site-1',
      undefined,
      undefined,
      seo,
    );

  beforeEach(() => {
    site = restore(null);
    sites = {
      findById: jest.fn(() => Promise.resolve(site)),
      findByIdForUpdate: jest.fn(() => Promise.resolve(site)),
      save: jest.fn().mockResolvedValue(undefined),
    };
    authorize = jest.fn().mockResolvedValue(true);
    handler = new UpdatePagePublicationSettingsHandler(
      {
        findBySiteAndPage: jest.fn().mockResolvedValue(publication),
      } as never,
      sites as never,
      {
        runInTransaction: (work: (manager: unknown) => unknown) => work({}),
      } as never,
      { lockWorkspace: jest.fn().mockResolvedValue(undefined) } as never,
      { isAvailable: jest.fn().mockResolvedValue(true) } as never,
      { authorize } as never,
    );
    jest
      .spyOn(PagePublicationResponseDto, 'fromDomain')
      .mockImplementation(
        (_publication, value) => ({ seo: value.getSeo() }) as never,
      );
  });

  it('saves SEO on the site after checking publish permission on the root page', async () => {
    const result = await handler.execute(
      command({ title: 'Docs', description: 'Guides', indexing: true }),
    );

    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({ target: { type: 'page', id: 'root-1' } }),
    );
    expect(sites.save).toHaveBeenCalledWith(site, {});
    expect(result.seo).toEqual({
      title: 'Docs',
      description: 'Guides',
      indexing: true,
    });
    expect(site.getAllowUpdates()).toBe(true);
  });

  it('rejects a user without publish permission on the root page', async () => {
    authorize.mockResolvedValue(false);

    await expect(handler.execute(command({ indexing: true }))).rejects.toThrow(
      ForbiddenException,
    );
    expect(sites.save).not.toHaveBeenCalled();
  });

  it('rejects SEO changes on a disabled site', async () => {
    site = restore(at);

    await expect(handler.execute(command({ title: 'Docs' }))).rejects.toThrow(
      BadRequestException,
    );
    expect(sites.save).not.toHaveBeenCalled();
  });

  it('still requires at least one setting', async () => {
    await expect(
      handler.execute(command({ title: undefined })),
    ).rejects.toThrow('At least one publication setting is required');
  });
});
