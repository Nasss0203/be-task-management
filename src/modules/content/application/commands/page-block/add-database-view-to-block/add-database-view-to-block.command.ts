import { AddDatabaseViewToBlockDto } from 'src/modules/content/application/dto/page/create-page-block.dto';

export class AddDatabaseViewToBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly dto: AddDatabaseViewToBlockDto,
  ) {}
}
