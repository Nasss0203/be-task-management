import { MovePageBlockDto } from 'src/modules/content/application/dto/page/move-page-block.dto';

export class MovePageBlockCommand {
  constructor(
    public readonly blockId: string,
    public readonly dto: MovePageBlockDto,
  ) {}
}
