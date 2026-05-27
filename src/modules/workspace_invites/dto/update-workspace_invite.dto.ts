import { PartialType } from '@nestjs/swagger';
import { CreateWorkspaceInviteDto } from './create-workspace_invite.dto';

export class UpdateWorkspaceInviteDto extends PartialType(
  CreateWorkspaceInviteDto,
) {}
