import { IsString, Matches, MaxLength } from 'class-validator';

export class GetSlackAuthorizeUrlRequest {
  @IsString()
  @MaxLength(512)
  @Matches(/^\/(?![/\\])[^\s\\]*$/, {
    message: 'returnTo must be a path inside the app',
  })
  returnTo: string;
}
