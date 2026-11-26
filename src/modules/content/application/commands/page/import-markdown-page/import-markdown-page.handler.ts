import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ContentPageProvisioningPort } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { CreatePageCommand } from '../create-page/create-page.command';
import { CreatePageHandler } from '../create-page/create-page.handler';
import { ImportMarkdownPageCommand } from './import-markdown-page.command';
import {
  MARKDOWN_IMPORT_LIMITS,
  type MarkdownImportWarning,
  markdownToPageBlocks,
} from './markdown-to-page-blocks';

export interface ImportMarkdownPageResult {
  pageId: string;
  title: string;
  blockCount: number;
  warnings: MarkdownImportWarning[];
}

const titleFromFileName = (fileName: string) =>
  (fileName.split(/[\\/]/).pop() ?? '').replace(/\.(md|markdown)$/i, '').trim();

@Injectable()
export class ImportMarkdownPageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.applications.CreatePageHandler)
    private readonly createPage: CreatePageHandler,

    @Inject(CONTENT_TYPES.ports.PageProvisioning)
    private readonly pageProvisioning: ContentPageProvisioningPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(
    command: ImportMarkdownPageCommand,
  ): Promise<ImportMarkdownPageResult> {
    let markdown: string;
    try {
      markdown = new TextDecoder('utf-8', { fatal: true }).decode(command.file);
    } catch {
      throw new BadRequestException('The file is not valid UTF-8 text');
    }

    const draft = markdownToPageBlocks(markdown);
    if (draft.blocks.length > MARKDOWN_IMPORT_LIMITS.maxBlocks) {
      throw new BadRequestException(
        `The file has more than ${MARKDOWN_IMPORT_LIMITS.maxBlocks} blocks`,
      );
    }

    const parent = await this.pageRepo.findById(command.parentPageId);
    if (!parent || parent.getDeletedAt() !== null) {
      throw new NotFoundException('Parent page not found');
    }

    const title = (
      draft.title ||
      titleFromFileName(command.fileName) ||
      'Untitled'
    ).slice(0, MARKDOWN_IMPORT_LIMITS.maxTitleLength);

    const page = await this.uow.runInTransaction(async (context) => {
      const created = await this.createPage.execute(
        new CreatePageCommand(
          command.userId,
          parent.getWorkspaceId(),
          title,
          null,
          parent.getId(),
        ),
        context,
      );
      await this.pageProvisioning.createBlocksFromSnapshot(
        { pageId: created.id, createdBy: command.userId, blocks: draft.blocks },
        context,
      );
      return created;
    });

    return {
      pageId: page.id,
      title: page.title,
      blockCount: draft.blocks.length,
      warnings: draft.warnings,
    };
  }
}
