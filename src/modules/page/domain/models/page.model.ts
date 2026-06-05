import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';

export class PageModel {
  constructor(
    public readonly id: string,
    public readonly workspace_id: string,
    public readonly slug: string | null,
    public readonly title: string,
    public readonly icon: string | null,
    public readonly cover_url: string | null,
    public readonly is_template: boolean,
    public readonly created_by: string,
    public readonly blocks: PageBlock[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,

    public readonly deletedAt: Date | null = null,
    public readonly deletedBy: string | null = null,
  ) {}
}
