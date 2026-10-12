import { IsBoolean, IsDefined } from 'class-validator';

export class ChangeTemplateCategoryStatusRequestDto {
  @IsDefined()
  @IsBoolean()
  is_active!: boolean;
}
