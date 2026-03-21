import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';

export class CreatePageDto {
  workspace_id: string;
  title: string;
  slug: string;
  is_template?: boolean;
  created_by: string;
  blocks?: PageBlock[];
}
