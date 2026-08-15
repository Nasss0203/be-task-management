import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDatabaseRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
