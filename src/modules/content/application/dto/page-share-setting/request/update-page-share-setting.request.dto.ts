import { IsEnum } from 'class-validator';
import { PageGeneralAccess } from 'src/modules/content/domain/constants/page-general-access.constant';

export class UpdatePageShareSettingRequestDto {
  @IsEnum(PageGeneralAccess)
  generalAccess: PageGeneralAccess;
}
