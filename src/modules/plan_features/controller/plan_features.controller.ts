import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { CreatePlanFeatureDto } from '../dto/create-plan_feature.dto';
import { PlanFeatureResponseDto } from '../dto/response/plan_feature.response.dto';
import { UpdatePlanFeatureDto } from '../dto/update-plan_feature.dto';
import { type CreatePlanFeatureApplication } from '../interfaces/applications/create.plan_feature.application.interface';
import { type DeletePlanFeatureApplication } from '../interfaces/applications/delete.plan_feature.application.interface';
import { type FindPlanFeatureApplication } from '../interfaces/applications/find.plan_feature.application.interface';
import { type UpdatePlanFeatureApplication } from '../interfaces/applications/update.plan_feature.application.interface';
import { PLAN_FEATURE_TYPES } from '../interfaces/types';

@Controller('plan-features')
@RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
export class PlanFeaturesController {
  constructor(
    @Inject(PLAN_FEATURE_TYPES.applications.CreatePlanFeatureApplication)
    private readonly createPlanFeatureApplication: CreatePlanFeatureApplication,

    @Inject(PLAN_FEATURE_TYPES.applications.FindPlanFeatureApplication)
    private readonly findPlanFeatureApplication: FindPlanFeatureApplication,

    @Inject(PLAN_FEATURE_TYPES.applications.UpdatePlanFeatureApplication)
    private readonly updatePlanFeatureApplication: UpdatePlanFeatureApplication,

    @Inject(PLAN_FEATURE_TYPES.applications.DeletePlanFeatureApplication)
    private readonly deletePlanFeatureApplication: DeletePlanFeatureApplication,
  ) {}

  @Post()
  create(
    @Body() createPlanFeatureDto: CreatePlanFeatureDto,
  ): Promise<PlanFeatureResponseDto> {
    return this.createPlanFeatureApplication.create(createPlanFeatureDto);
  }

  @Get()
  findAll(): Promise<PlanFeatureResponseDto[]> {
    return this.findPlanFeatureApplication.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PlanFeatureResponseDto> {
    return this.findPlanFeatureApplication.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePlanFeatureDto: UpdatePlanFeatureDto,
  ): Promise<PlanFeatureResponseDto> {
    return this.updatePlanFeatureApplication.update(id, updatePlanFeatureDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deletePlanFeatureApplication.delete(id);

    return {
      success: true,
    };
  }
}
