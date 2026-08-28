import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ResolveBookmarkMetadataRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url: string;
}
