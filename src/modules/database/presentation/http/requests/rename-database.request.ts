import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameDatabaseRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
