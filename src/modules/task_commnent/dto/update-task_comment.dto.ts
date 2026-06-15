import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTaskCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
