import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CreatePageBlocksFromSnapshotInput } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { CreatePageCommand } from '../create-page/create-page.command';
import { ImportMarkdownPageCommand } from './import-markdown-page.command';
import { ImportMarkdownPageHandler } from './import-markdown-page.handler';

describe('ImportMarkdownPageHandler', () => {
  const context = { transaction: true };
  const parent = {
    getId: () => 'parent-1',
    getWorkspaceId: () => 'workspace-1',
    getDeletedAt: () => null,
  };
  const pageRepo = { findById: jest.fn() };
  const createPage = {
    execute: jest
      .fn<
        Promise<{ id: string; title: string }>,
        [CreatePageCommand, unknown]
      >()
      .mockImplementation((command) =>
        Promise.resolve({ id: 'page-new', title: command.title }),
      ),
  };
  const pageProvisioning = {
    createBlocksFromSnapshot: jest
      .fn<Promise<void>, [CreatePageBlocksFromSnapshotInput, unknown]>()
      .mockResolvedValue(undefined),
  };
  const uow = {
    runInTransaction: jest.fn((work: (ctx: unknown) => Promise<unknown>) =>
      work(context),
    ),
  };
  const handler = new ImportMarkdownPageHandler(
    pageRepo as never,
    createPage as never,
    pageProvisioning as never,
    uow as never,
  );

  const run = (markdown: string | Buffer, fileName = 'notes.md') =>
    handler.execute(
      new ImportMarkdownPageCommand(
        'parent-1',
        'user-1',
        fileName,
        typeof markdown === 'string' ? Buffer.from(markdown) : markdown,
      ),
    );

  const listOf = (count: number) =>
    Array.from({ length: count }, (_, index) => `- ${index}`).join('\n');

  beforeEach(() => {
    jest.clearAllMocks();
    pageRepo.findById.mockResolvedValue(parent);
  });

  it('creates a child page and its blocks in one transaction', async () => {
    const result = await run('# Plan\n\n- A\n  - B\n\n![](a.png)\n');

    const [command, createContext] = createPage.execute.mock.calls[0];
    expect(command).toEqual(
      new CreatePageCommand('user-1', 'workspace-1', 'Plan', null, 'parent-1'),
    );
    expect(createContext).toBe(context);
    const [input, blockContext] =
      pageProvisioning.createBlocksFromSnapshot.mock.calls[0];
    expect(blockContext).toBe(context);
    expect(input.pageId).toBe('page-new');
    expect(input.blocks).toHaveLength(3);
    expect(result).toEqual({
      pageId: 'page-new',
      title: 'Plan',
      blockCount: 3,
      warnings: [{ line: 6, message: 'Ảnh cục bộ "a.png" chưa được tải lên' }],
    });
  });

  it('names the page after the file when there is no top heading', async () => {
    await run('chữ', 'folder/Ghi chú.markdown');
    await run('chữ', '.md');

    expect(
      createPage.execute.mock.calls.map(([command]) => command.title),
    ).toEqual(['Ghi chú', 'Untitled']);
  });

  it('cuts long titles to 255 characters', async () => {
    const result = await run(`# ${'a'.repeat(300)}`);

    expect(result.title).toHaveLength(255);
  });

  it('lets a failure while adding blocks reach the transaction', async () => {
    pageProvisioning.createBlocksFromSnapshot.mockRejectedValueOnce(
      new Error('db down'),
    );

    await expect(run('# T\n\nchữ')).rejects.toThrow('db down');
    expect(uow.runInTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects files over the block limit before opening a transaction', async () => {
    await expect(run(listOf(2001))).rejects.toBeInstanceOf(BadRequestException);
    expect(uow.runInTransaction).not.toHaveBeenCalled();
    expect(createPage.execute).not.toHaveBeenCalled();
  });

  it('accepts exactly the block limit', async () => {
    await expect(run(listOf(2000))).resolves.toMatchObject({
      blockCount: 2000,
    });
  });

  it('rejects text that is not UTF-8', async () => {
    await expect(run(Buffer.from([0xff, 0xfe, 0x41]))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(uow.runInTransaction).not.toHaveBeenCalled();
  });

  it('returns 404 when the parent page is gone', async () => {
    pageRepo.findById.mockResolvedValue(null);

    await expect(run('# T')).rejects.toBeInstanceOf(NotFoundException);
    expect(uow.runInTransaction).not.toHaveBeenCalled();
  });
});
