import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WorkspaceStarter } from 'src/modules/workspace/domain/enums/workspace-starter.enum';

export class CreateWorkspaceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEnum(WorkspaceStarter)
  starter?: WorkspaceStarter;
}
