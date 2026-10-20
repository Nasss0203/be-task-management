import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExtractAiPageIntentRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  instruction: string;
}
