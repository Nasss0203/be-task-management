import { PartialType } from '@nestjs/swagger';
import { CreateWorkspaceMultiServiceDto } from './create-workspace.dto';

export class UpdateWorkspaceDto extends PartialType(
  CreateWorkspaceMultiServiceDto,
) {}
