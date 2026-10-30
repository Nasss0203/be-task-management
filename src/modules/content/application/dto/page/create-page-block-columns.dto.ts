import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import {
  MAX_COLUMNS,
  MIN_COLUMNS,
} from 'src/modules/content/domain/policies/page-block-container.policy';

export class CreatePageBlockColumnsDto {
  @IsUUID()
  page_id: string;

  /** Blocks to set side by side, left to right; the row takes the first one's place. */
  @IsArray()
  @ArrayMinSize(MIN_COLUMNS)
  @ArrayMaxSize(MAX_COLUMNS)
  @IsUUID('all', { each: true })
  block_ids: string[];
}
