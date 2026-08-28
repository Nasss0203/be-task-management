import { Inject, Injectable } from '@nestjs/common';

import type {
  BookmarkMetadata,
  BookmarkMetadataFetcherPort,
} from '../../../../attachment/application/ports/bookmark-metadata-fetcher.port';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { ResolveBookmarkMetadataQuery } from './resolve-bookmark-metadata.query';

@Injectable()
export class ResolveBookmarkMetadataHandler {
  constructor(
    @Inject(CONTENT_TYPES.bookmarkMetadataFetcher)
    private readonly bookmarkMetadataFetcher: BookmarkMetadataFetcherPort,
  ) {}

  execute(query: ResolveBookmarkMetadataQuery): Promise<BookmarkMetadata> {
    return this.bookmarkMetadataFetcher.fetch(query.url);
  }
}
