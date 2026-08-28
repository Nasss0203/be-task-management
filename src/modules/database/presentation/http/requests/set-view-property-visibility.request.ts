import { IsBoolean } from 'class-validator';

export class SetViewPropertyVisibilityRequest {
  @IsBoolean()
  visible: boolean;
}
