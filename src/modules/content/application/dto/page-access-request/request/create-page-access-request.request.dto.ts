import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePageAccessRequestRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
