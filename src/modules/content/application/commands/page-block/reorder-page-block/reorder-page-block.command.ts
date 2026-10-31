import { ReorderPageBlockDto } from 'src/modules/content/application/dto/page/reorder-page-block.dto';

export class ReorderPageBlockCommand {
  constructor(
    public readonly dto: ReorderPageBlockDto,
    // Who made the change, for the activity log; absent for system work.
    public readonly actorId?: string,
  ) {}
}
