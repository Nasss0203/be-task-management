import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptPageShareLinkRequestDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
