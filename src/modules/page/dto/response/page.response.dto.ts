import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';

export class PageResponseDto {
  id: string;

  workspace_id: string;

  title: string;

  slug: string | null;

  is_template: boolean;

  created_by: string;

  blocks: PageBlock[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  deletedBy: string | null;
}
