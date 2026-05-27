import { UsageResourceType } from '../domain/entities/usage-limit.entity';

export const FREE_PLAN_SLUG = 'free';
export const PRO_PLAN_SLUG = 'pro-monthly';

export const DEFAULT_PLAN_LIMITS: Record<
  string,
  Record<string, number | null>
> = {
  [FREE_PLAN_SLUG]: {
    workspaces: 5,
    upgradedWorkspaces: 0,
    members: 3,
    projects: 3,
    tasks: 100,
    pages: 20,
    pageTemplates: 5,
    storageMb: 100,
    attachments: 20,
    sprints: 3,
  },

  [PRO_PLAN_SLUG]: {
    workspaces: 15,
    upgradedWorkspaces: 15,
    members: 10,
    projects: 20,
    tasks: 1000,
    pages: 100,
    pageTemplates: 20,
    storageMb: 1024,
    attachments: 200,
    sprints: 20,
  },
};

export const RESOURCE_LIMIT_KEY_MAP: Record<UsageResourceType, string> = {
  [UsageResourceType.MEMBERS]: 'members',
  [UsageResourceType.PROJECTS]: 'projects',
  [UsageResourceType.TASKS]: 'tasks',
  [UsageResourceType.PAGES]: 'pages',
  [UsageResourceType.PAGE_TEMPLATES]: 'pageTemplates',
  [UsageResourceType.STORAGE_MB]: 'storageMb',
  [UsageResourceType.ATTACHMENTS]: 'attachments',
  [UsageResourceType.SPRINTS]: 'sprints',
};
