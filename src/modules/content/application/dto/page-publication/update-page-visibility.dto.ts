import { IsBoolean } from 'class-validator';

export class UpdatePageVisibilityDto {
  @IsBoolean()
  published: boolean;
}
