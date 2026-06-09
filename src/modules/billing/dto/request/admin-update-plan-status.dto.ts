import { IsBoolean } from 'class-validator';

export class AdminUpdatePlanStatusDto {
  @IsBoolean()
  isActive: boolean;
}
