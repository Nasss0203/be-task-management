import { BadRequestException } from '@nestjs/common';
import { TemplateEntitlementSource } from '../../../../../marketplace/domain/enums/template-entitlement-source.enum';
import { TemplateListingStatus } from '../../../../../marketplace/domain/enums/template-listing-status.enum';
import { TemplateStatus } from '../../../../domain/enums/template-status.enum';
import { TemplateVisibility } from '../../../../domain/enums/template-visibility.enum';
import { TemplateVersionStatus } from '../../../../domain/enums/template-version-status.enum';
import type { ClaimedTemplateReadModel } from '../../../../../marketplace/domain/repositories/claimed-template.read-model';
import type { TemplateEntitlementRepository } from '../../../../../marketplace/domain/repositories/template-entitlement.repository';
import {
  decodeTemplateListCursor,
  encodeTemplateListCursor,
} from '../../page-template/list-page-templates/template-list-cursor.helper';
import { GetMyClaimedTemplatesHandler } from '../../../../../marketplace/application/queries/template-entitlement/get-my-claimed-templates/get-my-claimed-templates.handler';
import { GetMyClaimedTemplatesQuery } from '../../../../../marketplace/application/queries/template-entitlement/get-my-claimed-templates/get-my-claimed-templates.query';

describe('GetMyClaimedTemplatesHandler', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  const claimedAt = new Date('2026-10-11T00:00:00.000Z');
  const item: ClaimedTemplateReadModel = {
    entitlementId: id,
    templateId: 'template-a',
    source: TemplateEntitlementSource.FREE_CLAIM,
    claimedAt,
    name: 'Planning',
    description: 'A template',
    icon: null,
    coverUrl: null,
    visibility: TemplateVisibility.PUBLIC,
    status: TemplateStatus.PUBLISHED,
    listingStatus: TemplateListingStatus.PUBLISHED,
    publishedVersion: {
      id: 'pinned-v1',
      templateId: 'template-a',
      versionNumber: 1,
      status: TemplateVersionStatus.PUBLISHED,
      publishedAt: claimedAt,
    },
  };
  const findClaimedByUser = jest.fn();
  const handler = new GetMyClaimedTemplatesHandler({
    findClaimedByUser,
  } as unknown as TemplateEntitlementRepository);
  beforeEach(() => findClaimedByUser.mockReset());

  it('returns an empty list and scopes reads to the authenticated user', async () => {
    findClaimedByUser.mockResolvedValue({ items: [], hasNextPage: false });
    await expect(
      handler.execute(new GetMyClaimedTemplatesQuery('user-a')),
    ).resolves.toEqual({ items: [], nextCursor: null });
    expect(findClaimedByUser).toHaveBeenCalledWith({
      userId: 'user-a',
      limit: 20,
      cursor: undefined,
    });
  });

  it('maps only library metadata and uses the last returned entitlement for pagination', async () => {
    findClaimedByUser.mockResolvedValue({ items: [item], hasNextPage: true });
    const result = await handler.execute(
      new GetMyClaimedTemplatesQuery('user-a', undefined, 1),
    );
    expect(decodeTemplateListCursor(result.nextCursor!)).toEqual({
      createdAt: claimedAt,
      id,
    });
    expect(result.items[0]).toEqual({
      entitlement_id: id,
      template_id: 'template-a',
      source: 'FREE_CLAIM',
      claimed_at: claimedAt,
      name: 'Planning',
      description: 'A template',
      icon: null,
      cover_url: null,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      listing_status: 'PUBLISHED',
      published_version: {
        id: 'pinned-v1',
        template_id: 'template-a',
        version_number: 1,
        status: 'PUBLISHED',
        published_at: claimedAt,
      },
    });
    await handler.execute(
      new GetMyClaimedTemplatesQuery('user-a', result.nextCursor!, 1),
    );
    expect(findClaimedByUser).toHaveBeenLastCalledWith({
      userId: 'user-a',
      limit: 1,
      cursor: { createdAt: claimedAt, id },
    });
  });

  it.each([TemplateListingStatus.DRAFT, TemplateListingStatus.PUBLISHED, null])(
    'retains claimed entries with listing status %s, including archived templates',
    async (listingStatus) => {
      findClaimedByUser.mockResolvedValue({
        items: [{ ...item, listingStatus, status: TemplateStatus.ARCHIVED }],
        hasNextPage: false,
      });
      const result = await handler.execute(
        new GetMyClaimedTemplatesQuery('user-a'),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].status).toBe('ARCHIVED');
      expect(result.items[0].listing_status).toBe(listingStatus);
      expect(result.nextCursor).toBeNull();
      expect(result.items[0]).not.toHaveProperty('can_use');
    },
  );

  it.each([0, 101, 1.5, NaN, Infinity])(
    'rejects invalid limit %s before querying',
    async (limit) => {
      await expect(
        handler.execute(
          new GetMyClaimedTemplatesQuery('user-a', undefined, limit),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(findClaimedByUser).not.toHaveBeenCalled();
    },
  );

  it.each([
    '',
    'bad-cursor',
    encodeTemplateListCursor({ createdAt: claimedAt, id: 'bad-id' }),
  ])('rejects invalid cursor before querying', async (cursor) => {
    await expect(
      handler.execute(new GetMyClaimedTemplatesQuery('user-a', cursor)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(findClaimedByUser).not.toHaveBeenCalled();
  });
});
