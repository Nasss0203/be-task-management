import type { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { FastApiAiRuntimeAdapter } from '../../infrastructure/runtime/fast-api-ai-runtime.adapter';
import type { AiConversationAccessService } from '../services/ai-conversation-access.service';
import {
  BLOCK_CHUNK_LIMIT,
  buildPageEmbeddingChunks,
  embeddingBatches,
  splitText,
} from './page-embedding-chunks';
import { PageEmbeddingIndexer } from './page-embedding-indexer.service';
import type {
  PageEmbeddingSource,
  PageEmbeddingStore,
  StoredPageEmbedding,
  TextEmbedder,
} from './page-embedding.port';
import { PageEmbeddingSearch } from './page-embedding-search.service';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

// M5 (kế hoạch hạ tầng vector).
const source = (
  blocks: PageEmbeddingSource['blocks'] = [],
): PageEmbeddingSource => ({
  pageId: 'page-1',
  workspaceId: 'workspace-1',
  title: 'Release 2.0',
  blocks,
  readAt: '2026-10-29 10:00:00',
});
const block = (id: string, type: string, text: unknown, title = null) => ({
  id,
  type,
  title,
  content: text === undefined ? null : { text },
});

describe('buildPageEmbeddingChunks (F4)', () => {
  it('makes a Page row from the title and headers, and one row per block with text', () => {
    const chunks = buildPageEmbeddingChunks(
      source([
        block('h1', 'HEADER', 'Checklist  phát hành'),
        block('t1', 'TODO', 'Viết\nrelease notes'),
        block('empty', 'TEXT', '   '),
        block('none', 'DIVIDER', undefined),
        block('view', 'DATABASE_VIEW', 'Bugs'),
      ]),
    );
    expect(
      chunks.map(({ resourceType, blockId, text }) => [
        resourceType,
        blockId,
        text,
      ]),
    ).toEqual([
      ['PAGE', null, 'Release 2.0\nChecklist phát hành'],
      ['BLOCK', 'h1', 'Checklist phát hành'],
      ['BLOCK', 't1', 'Viết release notes'],
    ]);
  });

  it('hashes NFC text, so the same words in another Unicode form are unchanged', () => {
    const composed = buildPageEmbeddingChunks(
      source([block('t', 'TEXT', 'Phát hành')]),
    );
    const decomposed = buildPageEmbeddingChunks(
      source([block('t', 'TEXT', 'Phát hành'.normalize('NFD'))]),
    );
    expect(decomposed[1].contentHash).toBe(composed[1].contentHash);
    expect(composed[1].contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('adds the caption of an image or file', () => {
    const chunks = buildPageEmbeddingChunks(
      source([
        {
          id: 'img',
          type: 'IMAGE',
          title: null,
          content: { url: 'x', caption: 'Sơ đồ OAuth' },
        },
      ]),
    );
    expect(chunks[1].text).toBe('Sơ đồ OAuth');
  });
});

describe('splitText', () => {
  it('keeps short text whole and cuts long text after sentences', () => {
    expect(splitText('Một câu.')).toEqual(['Một câu.']);
    const sentence = `${'a'.repeat(700)}.`;
    const pieces = splitText(`${sentence} ${sentence} ${sentence}`);
    expect(pieces).toEqual([`${sentence} ${sentence}`, sentence]);
  });

  it('cuts a sentence longer than the limit', () => {
    const pieces = splitText('b'.repeat(BLOCK_CHUNK_LIMIT * 2 + 10));
    expect(pieces.map((piece) => piece.length)).toEqual([
      BLOCK_CHUNK_LIMIT,
      BLOCK_CHUNK_LIMIT,
      10,
    ]);
  });
});

describe('embeddingBatches', () => {
  it('keeps each request within the count and the total length', () => {
    const items = (lengths: number[]) =>
      lengths.map((n) => ({ text: 'x'.repeat(n) }));
    expect(
      embeddingBatches(items([1, 1, 1]), 2, 100).map((b) => b.length),
    ).toEqual([2, 1]);
    expect(
      embeddingBatches(items([60, 60, 30]), 32, 100).map((b) => b.length),
    ).toEqual([1, 2]);
  });
});

describe('PageEmbeddingIndexer (F5)', () => {
  const vector = [1, 0];
  let store: Record<keyof PageEmbeddingStore, jest.Mock>;
  let embed: jest.Mock;
  let indexer: PageEmbeddingIndexer;
  const stored = (over: Partial<StoredPageEmbedding>): StoredPageEmbedding => ({
    id: 'row',
    resourceType: 'BLOCK',
    blockId: 't1',
    chunkIndex: 0,
    contentHash: '',
    model: 'm1',
    ...over,
  });

  beforeEach(() => {
    store = {
      withIndexLock: jest.fn((work: () => Promise<unknown>) => work()),
      findPagesToIndex: jest.fn().mockResolvedValue(['page-1']),
      findTrashedIndexedPages: jest.fn().mockResolvedValue([]),
      loadSource: jest
        .fn()
        .mockResolvedValue(source([block('t1', 'TEXT', 'Đóng băng code')])),
      findStored: jest.fn().mockResolvedValue([]),
      savePage: jest.fn().mockResolvedValue(undefined),
      removePage: jest.fn().mockResolvedValue(undefined),
      findWorkspaceVectors: jest.fn(),
    };
    embed = jest.fn((_kind: string, texts: string[]) =>
      Promise.resolve({
        model: 'm1',
        dimensions: 2,
        embeddings: texts.map(() => vector),
      }),
    );
    indexer = new PageEmbeddingIndexer(
      store as unknown as PageEmbeddingStore,
      { embed } as TextEmbedder,
      new ConfigService({}),
    );
  });

  it('embeds a new Page and saves its vectors with the time it was read', async () => {
    expect(await indexer.runOnce()).toEqual({
      removed: 0,
      indexed: 1,
      embedded: 2,
    });
    expect(store.findPagesToIndex).toHaveBeenCalledWith('m1', 20);
    expect(embed).toHaveBeenLastCalledWith('document', [
      'Release 2.0',
      'Đóng băng code',
    ]);
    expect(store.savePage).toHaveBeenCalledWith({
      pageId: 'page-1',
      workspaceId: 'workspace-1',
      readAt: '2026-10-29 10:00:00',
      model: 'm1',
      keepIds: [],
      added: [
        expect.objectContaining({
          resourceType: 'PAGE',
          blockId: null,
          dimensions: 2,
          embedding: vector,
        }),
        expect.objectContaining({
          resourceType: 'BLOCK',
          blockId: 't1',
          chunkIndex: 0,
        }),
      ],
    });
  });

  it('only embeds text whose hash changed', async () => {
    const [page, text] = buildPageEmbeddingChunks(
      source([block('t1', 'TEXT', 'Đóng băng code')]),
    );
    store.findStored.mockResolvedValue([
      stored({
        id: 'keep',
        resourceType: 'PAGE',
        blockId: null,
        contentHash: page.contentHash,
      }),
      stored({ id: 'old', contentHash: 'stale' }),
      stored({
        id: 'gone',
        blockId: 'deleted-block',
        contentHash: text.contentHash,
      }),
    ]);
    await indexer.runOnce();
    expect(embed).toHaveBeenLastCalledWith('document', ['Đóng băng code']);
    expect(store.savePage).toHaveBeenCalledWith(
      expect.objectContaining({
        keepIds: ['keep'],
        added: [expect.objectContaining({ blockId: 't1' })],
      }),
    );
  });

  it('embeds again rows made with another model', async () => {
    const [page] = buildPageEmbeddingChunks(source());
    store.loadSource.mockResolvedValue(source());
    store.findStored.mockResolvedValue([
      stored({
        id: 'old-model',
        resourceType: 'PAGE',
        blockId: null,
        contentHash: page.contentHash,
        model: 'm0',
      }),
    ]);
    await indexer.runOnce();
    expect(store.savePage).toHaveBeenCalledWith(
      expect.objectContaining({
        keepIds: [],
        added: [expect.objectContaining({ model: 'm1' })],
      }),
    );
  });

  it('removes the vectors of Pages in the Trash', async () => {
    store.findTrashedIndexedPages.mockResolvedValue(['trashed']);
    store.findPagesToIndex.mockResolvedValue([]);
    expect(await indexer.runOnce()).toEqual({
      removed: 1,
      indexed: 0,
      embedded: 0,
    });
    expect(store.removePage).toHaveBeenCalledWith('trashed');
  });

  it('saves nothing when the AI service fails, so the next run tries again', async () => {
    await indexer.runOnce(); // learns the model
    embed.mockRejectedValue(new Error('down'));
    store.savePage.mockClear();
    await expect(indexer.runOnce()).rejects.toThrow('down');
    expect(store.savePage).not.toHaveBeenCalled();
  });

  it('stops when the AI service changed model, and uses the new one next run', async () => {
    await indexer.runOnce();
    store.savePage.mockClear();
    embed.mockImplementation((_kind: string, texts: string[]) =>
      Promise.resolve({
        model: 'm2',
        dimensions: 2,
        embeddings: texts.map(() => vector),
      }),
    );
    expect(await indexer.runOnce()).toEqual({
      removed: 0,
      indexed: 0,
      embedded: 0,
    });
    expect(store.savePage).not.toHaveBeenCalled();
    await indexer.runOnce();
    expect(store.findPagesToIndex).toHaveBeenLastCalledWith('m2', 20);
    expect(store.savePage).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'm2' }),
    );
  });

  it('does nothing while another process holds the lock', async () => {
    store.withIndexLock.mockResolvedValue(null);
    expect(await indexer.runOnce()).toBeNull();
    expect(embed).not.toHaveBeenCalled();
  });

  it('starts no timer unless AI_EMBEDDING_INDEXER_ENABLED=true', () => {
    const spy = jest.spyOn(global, 'setInterval');
    indexer.onModuleInit();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('PageEmbeddingSearch (F7)', () => {
  const readable = (pageId: string) => ({
    pageId,
    workspaceId: 'workspace-1',
    title: `Title ${pageId}`,
    parentPageId: null,
    teamspaceId: null,
  });
  const findWorkspaceVectors = jest.fn();
  const embed = jest.fn();
  const getReadablePage = jest.fn();
  const search = new PageEmbeddingSearch(
    { findWorkspaceVectors } as unknown as PageEmbeddingStore,
    { embed } as TextEmbedder,
    { getReadablePage } as unknown as AiConversationAccessService,
  );
  const input = {
    userId: 'user-1',
    workspaceId: 'workspace-1',
    query: ' trang  nói về OAuth ',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    embed.mockResolvedValue({
      model: 'm1',
      dimensions: 2,
      embeddings: [[1, 0]],
    });
    findWorkspaceVectors.mockResolvedValue([
      {
        pageId: 'auth',
        blockId: 'b1',
        resourceType: 'BLOCK',
        embedding: [0.9, 0.1],
      },
      {
        pageId: 'auth',
        blockId: null,
        resourceType: 'PAGE',
        embedding: [0.5, 0.5],
      },
      {
        pageId: 'secret',
        blockId: null,
        resourceType: 'PAGE',
        embedding: [0.95, 0],
      },
      {
        pageId: 'other-ws',
        blockId: null,
        resourceType: 'PAGE',
        embedding: [0.8, 0],
      },
      {
        pageId: 'recipes',
        blockId: null,
        resourceType: 'PAGE',
        embedding: [0.1, 0.9],
      },
      {
        pageId: 'old-model',
        blockId: null,
        resourceType: 'PAGE',
        embedding: [1, 0, 0],
      },
    ]);
    getReadablePage.mockImplementation((_user: string, pageId: string) => {
      if (pageId === 'secret') return Promise.reject(new ForbiddenException());
      if (pageId === 'gone') return Promise.reject(new NotFoundException());
      return Promise.resolve({
        getId: () => pageId,
        getWorkspaceId: () =>
          pageId === 'other-ws' ? 'workspace-2' : 'workspace-1',
        getTitle: () => `Title ${pageId}`,
        getParentPageId: () => null,
        getTeamspaceId: () => null,
      });
    });
  });

  it('ranks Pages by their best row and returns only readable Pages of the workspace', async () => {
    expect(await search.search(input)).toEqual([
      {
        pageId: 'auth',
        score: 0.9,
        blockId: 'b1',
        page: { ...readable('auth'), title: 'Title auth' },
      },
      {
        pageId: 'recipes',
        score: 0.1,
        blockId: null,
        page: readable('recipes'),
      },
    ]);
    expect(embed).toHaveBeenCalledWith('query', ['trang nói về OAuth']);
    expect(findWorkspaceVectors).toHaveBeenCalledWith(
      'workspace-1',
      'm1',
      undefined,
    );
  });

  it('respects the limit and the resource type', async () => {
    expect(
      await search.search({ ...input, limit: 1, resourceType: 'PAGE' }),
    ).toHaveLength(1);
    expect(findWorkspaceVectors).toHaveBeenCalledWith(
      'workspace-1',
      'm1',
      'PAGE',
    );
  });

  it('asks nothing for an empty sentence', async () => {
    expect(await search.search({ ...input, query: '   ' })).toEqual([]);
    expect(embed).not.toHaveBeenCalled();
  });
});

describe('FastApiAiRuntimeAdapter.embed (F6)', () => {
  const setup = (data: unknown) => {
    const post = jest.fn().mockReturnValue(of({ data }));
    const adapter = new FastApiAiRuntimeAdapter(
      { post } as unknown as HttpService,
      new ConfigService({
        AI_SERVICE_BASE_URL: 'http://ai.test',
        AI_INTERNAL_TOKEN: 'private-test-token',
      }),
    );
    return { adapter, post };
  };
  const valid = {
    model: 'qwen3-embedding:0.6b',
    dimensions: 2,
    embeddings: [
      [0.6, 0.8],
      [1, 0],
    ],
  };

  it('posts the texts and returns the vectors', async () => {
    const { adapter, post } = setup(valid);
    await expect(adapter.embed('document', ['a', 'b'])).resolves.toEqual(valid);
    expect(post).toHaveBeenCalledWith(
      'http://ai.test/internal/v1/embeddings',
      { kind: 'document', texts: ['a', 'b'] },
      expect.anything(),
    );
  });

  it.each([
    ['an extra key', { ...valid, provider: 'ollama' }],
    ['one vector too few', { ...valid, embeddings: [[0.6, 0.8]] }],
    ['a vector of the wrong size', { ...valid, embeddings: [[0.6, 0.8], [1]] }],
    [
      'a value that is not a number',
      {
        ...valid,
        embeddings: [
          [0.6, '0.8'],
          [1, 0],
        ],
      },
    ],
    ['no model', { ...valid, model: ' ' }],
    ['no dimensions', { ...valid, dimensions: 0 }],
  ])('refuses %s', async (_name, data) => {
    await expect(
      setup(data).adapter.embed('document', ['a', 'b']),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
