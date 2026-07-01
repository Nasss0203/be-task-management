import { IsEmail, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class CreateSystemAdminDto {
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?$/, {
    message:
      'name can only contain letters, numbers, dots, underscores and hyphens',
  })
  name: string;

  @IsEmail()
  recipientEmail: string;
}
