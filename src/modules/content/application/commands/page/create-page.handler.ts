import { Inject, Injectable } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { generateSlug } from 'src/utils';

export class CreatePageCommand {
  constructor(
    public readonly userId: string,
    public readonly workspaceId: string,
    public readonly title: string,
    public readonly icon?: string | null,
    public readonly coverUrl?: string | null,
  ) {}
}

@Injectable()
export class CreatePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
  ) {}

  async execute(command: CreatePageCommand): Promise<PageResponseDto> {
    const baseSlug = generateSlug(command.title).toLowerCase();
    let slug = baseSlug;

    if (await this.pageRepo.existsBySlug(command.workspaceId, slug)) {
      const uniqueSuffix = Date.now().toString(36);
      slug = `${baseSlug}-${uniqueSuffix}`;
    }

    const page = Page.create({
      workspaceId: command.workspaceId,
      title: command.title,
      createdBy: command.userId,
      slug,
      icon: command.icon || null,
      coverUrl: command.coverUrl || null,
      isTemplate: false,
    });

    const savedPage = await this.pageRepo.save(page);

    return PageResponseDto.fromDomain(savedPage);
  }
}
