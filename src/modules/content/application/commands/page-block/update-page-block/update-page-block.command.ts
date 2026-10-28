import {
  type PageBlockJson,
  type PageBlockStyleConfig,
} from 'src/shared/domain/page-block.types';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';

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
    // Who made the change, for the activity log; absent for system work.
    public readonly actorId?: string,
  ) {}
}
