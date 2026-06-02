import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Plan } from '../billing/domain/entities/plan.entity';
import { FeatureKey } from '../features/constants/feature-key.constant';
import { Feature } from '../features/domain/entities/feature.entity';
import { PlanFeature } from '../plan_features/domain/entities/plan_feature.entity';

type FeatureSeedItem = {
  code: FeatureKey;
  legacyCodes?: string[];
  name: string;
  description: string;
  category: string;
  metadata?: Record<string, unknown>;
};

const FEATURE_SEED_DATA: FeatureSeedItem[] = [
  {
    code: FeatureKey.SPRINT_ENABLED,
    legacyCodes: ['sprint'],
    name: 'Sprint',
    description: 'Enable sprint planning and backlog workflows.',
    category: 'agile',
  },
];

@Injectable()
export class FeatureSeedService {
  private readonly logger = new Logger(FeatureSeedService.name);

  constructor(
    @InjectRepository(Feature)
    private readonly featureRepository: Repository<Feature>,

    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(PlanFeature)
    private readonly planFeatureRepository: Repository<PlanFeature>,
  ) {}

  async seedFeatures(): Promise<Feature[]> {
    const savedFeatures: Feature[] = [];

    for (const item of FEATURE_SEED_DATA) {
      const code = item.code.toLowerCase();
      const existed = await this.findExistingFeature(item);

      if (existed) {
        const saved = await this.featureRepository.save({
          ...existed,
          code,
          name: item.name,
          description: item.description,
          category: item.category,
          isActive: true,
          metadata: item.metadata ?? null,
          deletedAt: null,
        });

        savedFeatures.push(saved);
        this.logger.log(`Updated feature: ${code}`);
        continue;
      }

      const feature = this.featureRepository.create({
        code,
        name: item.name,
        description: item.description,
        category: item.category,
        isActive: true,
        metadata: item.metadata ?? null,
      });

      const saved = await this.featureRepository.save(feature);
      savedFeatures.push(saved);
      this.logger.log(`Seeded feature: ${code}`);
    }

    return savedFeatures;
  }

  private async findExistingFeature(item: FeatureSeedItem): Promise<Feature | null> {
    const code = item.code.toLowerCase();
    const exactFeature = await this.featureRepository
      .createQueryBuilder('feature')
      .withDeleted()
      .where('LOWER(feature.code) = :code', { code })
      .getOne();

    if (exactFeature) {
      return exactFeature;
    }

    const legacyCodes = item.legacyCodes?.map((legacyCode) =>
      legacyCode.toLowerCase(),
    );

    if (!legacyCodes || legacyCodes.length === 0) {
      return null;
    }

    return this.featureRepository
      .createQueryBuilder('feature')
      .withDeleted()
      .where('LOWER(feature.code) IN (:...legacyCodes)', { legacyCodes })
      .getOne();
  }

  async seedPlanFeatures(features: Feature[]): Promise<void> {
    const plans = await this.planRepository.find({
      where: { isActive: true },
    });

    for (const plan of plans) {
      for (const feature of features) {
        const enabled = plan.features?.[feature.code] === true;

        const existed = await this.planFeatureRepository.findOne({
          where: {
            planId: plan.id,
            featureId: feature.id,
          },
          withDeleted: true,
        });

        if (existed) {
          await this.planFeatureRepository.save({
            ...existed,
            enabled,
            deletedAt: null,
          });
          this.logger.log(
            `Updated plan feature: ${plan.slug} -> ${feature.code} = ${enabled}`,
          );
          continue;
        }

        await this.planFeatureRepository.save(
          this.planFeatureRepository.create({
            planId: plan.id,
            featureId: feature.id,
            enabled,
            metadata: null,
          }),
        );

        this.logger.log(
          `Seeded plan feature: ${plan.slug} -> ${feature.code} = ${enabled}`,
        );
      }
    }
  }

  async seed(): Promise<void> {
    const features = await this.seedFeatures();
    await this.seedPlanFeatures(features);
    this.logger.log('Feature seed completed');
  }
}
