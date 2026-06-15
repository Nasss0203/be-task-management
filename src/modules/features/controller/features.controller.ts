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
import {
  AdminRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { RequireSystemRoles } from 'src/common/decorator/require-system-roles.decorator';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { FeatureResponseDto } from '../dto/response/feature.response.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';
import { type CreateFeatureApplication } from '../interfaces/applications/create.feature.application.interface';
import { type DeleteFeatureApplication } from '../interfaces/applications/delete.feature.application.interface';
import { type FindFeatureApplication } from '../interfaces/applications/find.feature.application.interface';
import { type UpdateFeatureApplication } from '../interfaces/applications/update.feature.application.interface';
import { FEATURE_TYPES } from '../interfaces/types';

@Controller('features')
@RequireSystemRoles(SystemRole.SYSTEM_ADMIN, SystemRole.SUPER_ADMIN)
@AdminRateLimit()
export class FeaturesController {
  constructor(
    @Inject(FEATURE_TYPES.applications.CreateFeatureApplication)
    private readonly createFeatureApplication: CreateFeatureApplication,

    @Inject(FEATURE_TYPES.applications.FindFeatureApplication)
    private readonly findFeatureApplication: FindFeatureApplication,

    @Inject(FEATURE_TYPES.applications.UpdateFeatureApplication)
    private readonly updateFeatureApplication: UpdateFeatureApplication,

    @Inject(FEATURE_TYPES.applications.DeleteFeatureApplication)
    private readonly deleteFeatureApplication: DeleteFeatureApplication,
  ) {}

  @Post()
  @WriteRateLimit()
  create(
    @Body() createFeatureDto: CreateFeatureDto,
  ): Promise<FeatureResponseDto> {
    return this.createFeatureApplication.create(createFeatureDto);
  }

  @Get()
  findAll(): Promise<FeatureResponseDto[]> {
    return this.findFeatureApplication.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FeatureResponseDto> {
    return this.findFeatureApplication.findById(id);
  }

  @Patch(':id')
  @WriteRateLimit()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFeatureDto: UpdateFeatureDto,
  ): Promise<FeatureResponseDto> {
    return this.updateFeatureApplication.update(id, updateFeatureDto);
  }

  @Delete(':id')
  @WriteRateLimit()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.deleteFeatureApplication.delete(id);

    return {
      success: true,
    };
  }
}
