import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import type {
  PageBlockJson,
  PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';

export type ReplaceTemplateBlockInput = {
  sourceId: string;
  parentSourceId?: string | null;

  type: PageBlockType;
  title?: string | null;

  positionX: number;
  positionY: number;
  width: number;
  height: number;

  orderIndex: number;

  content?: PageBlockJson;
  styleConfig?: PageBlockStyleConfig;
  dataConfig?: PageBlockJson;

  isOpen?: boolean;
};

export class ReplaceTemplateBlocksCommand {
  constructor(
    public readonly versionId: string,
    public readonly userId: string,
    public readonly blocks: ReplaceTemplateBlockInput[],
  ) {}
}
