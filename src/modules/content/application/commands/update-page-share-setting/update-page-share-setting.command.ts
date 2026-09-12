import { PageGeneralAccess } from 'src/modules/content/domain/constants/page-general-access.constant';

export class UpdatePageShareSettingCommand {
  constructor(
    public readonly userId: string,

    public readonly pageId: string,

    public readonly generalAccess: PageGeneralAccess,
  ) {}
}
