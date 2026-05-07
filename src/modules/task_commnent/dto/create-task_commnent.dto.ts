import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTaskCommnentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
