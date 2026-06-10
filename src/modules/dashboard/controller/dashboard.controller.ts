import { Controller, Get, Inject, Query, ValidationPipe } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { MyDashboardQueryDto } from '../dto/my-dashboard-query.dto';
import { MyDashboardResponseDto } from '../dto/response/my-dashboard.response.dto';
import { type GetMyDashboardApplication } from '../interfaces/applications/get-my-dashboard.application.interface';
import { DASHBOARD_TYPES } from '../interfaces/types';

@Controller('dashboard')
export class DashboardController {
  constructor(
    @Inject(DASHBOARD_TYPES.applications.GetMyDashboardApplication)
    private readonly getMyDashboardApplication: GetMyDashboardApplication,
  ) {}

  @Get('me')
  @ResponseMessage('Get my dashboard')
  async getMyDashboard(
    @Auth() auth: IAuth,
    @Query(new ValidationPipe({ transform: true }))
    query: MyDashboardQueryDto,
  ): Promise<MyDashboardResponseDto> {
    return this.getMyDashboardApplication.getMyDashboard({
      userId: auth.id,
      username: auth.username,
      date: query.date,
      timezone: query.timezone,
      limit: query.limit,
    });
  }
}
