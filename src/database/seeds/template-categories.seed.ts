import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';

import { TemplateCategoryOrmEntity } from '../../modules/marketplace/infrastructure/persistence/typeorm/entities/template-category.orm-entity';
import dataSource from '../data-source';

const DEFAULT_CATEGORIES = [
  {
    name: 'Education',
    slug: 'education',
    description: 'Templates for learning and teaching',
  },
  {
    name: 'Esports',
    slug: 'esports',
    description: 'Templates for esports teams and tournaments',
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Templates for gaming communities and projects',
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Templates for business operations',
  },
  {
    name: 'Productivity',
    slug: 'productivity',
    description: 'Templates for improving productivity',
  },
  {
    name: 'Finance',
    slug: 'finance',
    description: 'Templates for finance and budgeting',
  },
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Templates for software and technology projects',
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'Templates for designers and creative teams',
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Templates for marketing campaigns',
  },
  {
    name: 'Personal',
    slug: 'personal',
    description: 'Templates for personal organization',
  },
  {
    name: 'Project Management',
    slug: 'project-management',
    description: 'Templates for managing projects',
  },
  {
    name: 'Health & Fitness',
    slug: 'health-fitness',
    description: 'Templates for health and fitness tracking',
  },
  {
    name: 'Events',
    slug: 'events',
    description: 'Templates for events and planning',
  },
  {
    name: 'Human Resources',
    slug: 'human-resources',
    description: 'Templates for HR and team management',
  },
  {
    name: 'Content Creation',
    slug: 'content-creation',
    description: 'Templates for content creators',
  },
];

export async function seedTemplateCategories(
  dataSource: DataSource,
): Promise<void> {
  const repository = dataSource.getRepository(TemplateCategoryOrmEntity);

  const now = new Date();

  const categories = DEFAULT_CATEGORIES.map((category, index) => ({
    id: randomUUID(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: true,
    sortOrder: index + 1,
    createdAt: now,
    updatedAt: now,
  }));

  await repository
    .createQueryBuilder()
    .insert()
    .values(categories)
    .orIgnore()
    .execute();

  console.log('Template Categories seeded successfully');
}

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    await seedTemplateCategories(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Failed to seed template categories:', error);
  process.exitCode = 1;
});
