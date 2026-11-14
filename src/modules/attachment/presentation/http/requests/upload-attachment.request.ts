import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadAttachmentRequest {
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  commentId?: string;

  @IsOptional()
  @IsUUID()
  pageBlockId?: string;
}
