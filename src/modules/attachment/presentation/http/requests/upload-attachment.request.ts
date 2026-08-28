import { IsOptional, IsString } from 'class-validator';

export class UploadAttachmentRequest {
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  commentId?: string;

  @IsOptional()
  @IsString()
  pageBlockId?: string;
}
