import { PartialType } from '@nestjs/swagger';
import { CreateRefreshTokenDto } from './create-refresh_token.dto';

export class UpdateRefreshTokenDto extends PartialType(CreateRefreshTokenDto) {}
