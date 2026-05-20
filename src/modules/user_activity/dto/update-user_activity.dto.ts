import { PartialType } from '@nestjs/swagger';
import { CreateUserActivityDto } from './create-user_activity.dto';

export class UpdateUserActivityDto extends PartialType(CreateUserActivityDto) {}
