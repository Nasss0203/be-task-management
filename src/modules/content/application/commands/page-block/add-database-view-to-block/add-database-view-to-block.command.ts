import { AddDatabaseViewToBlockDto } from 'src/modules/content/application/dto/page/create-page-block.dto';

export class AddDatabaseViewToBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly dto: AddDatabaseViewToBlockDto,
    // Who made the change, for the activity log; absent for system work.
    public readonly actorId?: string,
  ) {}
}
