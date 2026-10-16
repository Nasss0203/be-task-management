import { IsNotEmpty, IsString } from 'class-validator';

export class UseTemplateRequest {
  @IsNotEmpty()
  @IsString()
  workspace_id: string;
}
