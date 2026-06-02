import { SetMetadata } from '@nestjs/common';
import { FeatureKey } from 'src/modules/features/constants/feature-key.constant';

export const FEATURES_KEY = 'features';

export const RequireFeature = (...features: Array<FeatureKey | string>) =>
  SetMetadata(FEATURES_KEY, features);
