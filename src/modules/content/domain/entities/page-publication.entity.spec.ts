import { BadRequestException } from '@nestjs/common';
import { PagePublication } from './page-publication.entity';
import { PagePublicationType } from '../enums/page-publication-type.enum';

describe('PagePublication shape', () => {
  const props = { siteId: 'site', pageId: 'page', publishedBy: 'user' };
  it.each([
    { path: '/docs' },
    { path: '/', parentPublicationId: 'parent' },
    { path: '/', publicationType: PagePublicationType.INHERITED },
    {
      path: '/docs',
      parentPublicationId: 'parent',
      publicationType: PagePublicationType.INHERITED,
      includeDescendants: true,
    },
    { path: '/docs', id: 'self', parentPublicationId: 'self' },
  ])('rejects invalid create and restore shape %j', (shape) => {
    expect(() => PagePublication.create({ ...props, ...shape })).toThrow(
      BadRequestException,
    );
    expect(() =>
      PagePublication.restore({
        ...props,
        id: 'id',
        publishedAt: new Date(),
        unpublishedAt: null,
        updatedAt: new Date(),
        ...shape,
      }),
    ).toThrow(BadRequestException);
  });
});
