import {
  PageBlockType,
  type PageBlockJson,
  type PageBlockStyleConfig,
} from 'src/modules/content/domain/entities/page-block.entity';

export class CreatePageBlockCommand {
  constructor(
    public readonly input: {
      pageId: string;
      parentBlockId?: string | null;
      afterBlockId?: string | null;
      type: PageBlockType;
      createdBy: string;
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
