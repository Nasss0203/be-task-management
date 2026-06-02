import { PartialType } from '@nestjs/swagger';
import { CreatePlanFeatureDto } from './create-plan_feature.dto';

export class UpdatePlanFeatureDto extends PartialType(CreatePlanFeatureDto) {}
