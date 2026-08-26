import { IsNotEmpty, IsString } from 'class-validator';

export class RenameDatabaseViewRequest {
  @IsString()
  @IsNotEmpty()
  name: string;
}
