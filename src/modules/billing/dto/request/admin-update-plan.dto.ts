import { PartialType } from '@nestjs/swagger';

import { AdminCreatePlanDto } from './admin-create-plan.dto';

export class AdminUpdatePlanDto extends PartialType(AdminCreatePlanDto) {}
