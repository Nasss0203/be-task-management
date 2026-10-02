import {
  type PageBlockJson,
  type PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

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
