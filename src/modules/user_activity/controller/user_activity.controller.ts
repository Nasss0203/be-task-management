import { Body, Controller, Post } from '@nestjs/common';
import { UserActivityType } from '../domain/entities/user_activity.entity';
import { UserActivityService } from '../services/user_activity.service';

type RecordUserActivityDto = {
  userId: string;
  type?: UserActivityType;
};

@Controller('user-activity')
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Post('record')
  async record(@Body() dto: RecordUserActivityDto) {
    await this.userActivityService.record(
      dto.userId,
      dto.type ?? UserActivityType.OPEN_APP,
    );

    return {
      success: true,
    };
  }
}
