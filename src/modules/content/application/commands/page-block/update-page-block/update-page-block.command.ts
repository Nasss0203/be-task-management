import {
  PageBlockType,
  type PageBlockJson,
  type PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';

export class UpdatePageBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly updates: {
      type?: PageBlockType;
      title?: string | null;
      positionX?: number | null;
      positionY?: number | null;
      width?: number | null;
      height?: number | null;
      content?: PageBlockJson;
      styleConfig?: PageBlockStyleConfig;
      dataConfig?: PageBlockJson;
      isOpen?: boolean;
    },
  ) {}
}
