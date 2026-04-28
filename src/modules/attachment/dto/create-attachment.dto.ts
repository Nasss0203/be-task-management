import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAttachmentDto {}

export class UploadAttachmentDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsOptional()
  taskId?: string;

  @IsString()
  @IsOptional()
  commentId?: string;
}

export class DownloadAttachmentDto {
  @IsString()
  @IsNotEmpty()
  attachmentId: string;
}
