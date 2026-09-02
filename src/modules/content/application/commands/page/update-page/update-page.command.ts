import { UpdatePageDto } from 'src/modules/content/application/dto/page/update-page.dto';

export class UpdatePageCommand {
  constructor(
    public readonly pageId: string,
    public readonly dto: UpdatePageDto,
  ) {}
}
