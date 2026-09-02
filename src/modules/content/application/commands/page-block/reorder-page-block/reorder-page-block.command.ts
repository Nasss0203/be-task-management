import { ReorderPageBlockDto } from 'src/modules/content/application/dto/page/reorder-page-block.dto';

export class ReorderPageBlockCommand {
  constructor(public readonly dto: ReorderPageBlockDto) {}
}
