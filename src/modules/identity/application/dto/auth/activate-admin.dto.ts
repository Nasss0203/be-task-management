import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyActivationTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ActivateAdminDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Mật khẩu phải chứa ít nhất 8 ký tự' })
  password: string;
}
