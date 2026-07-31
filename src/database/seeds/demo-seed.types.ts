import type { RoleName } from 'src/modules/role/domain/entities/role.entity';
import type { SprintStatus } from 'src/modules/sprints/domain/entities/sprint.entity';

export type DemoSeedTable =
  | 'plans'
  | 'features'
  | 'planFeatures'
  | 'permissions'
  | 'users'
  | 'userProfiles'
  | 'subscriptions'
  | 'subscriptionWorkspaces'
  | 'workspaces'
  | 'usageLimits'
  | 'workspaceFeatureSettings'
  | 'roles'
  | 'rolePermissions'
  | 'workspaceMembers'
  | 'userRoles'
  | 'projects'
  | 'boards'
  | 'taskStatuses'
  | 'taskPriorities'
  | 'sprints'
  | 'tasks'
  | 'taskAssignees'
  | 'taskPositions'
  | 'comments'
  | 'activities'
  | 'notifications'
  | 'validations';

export type DemoSeedCounter = {
  created: number;
  existing: number;
  skipped: number;
  failed: number;
  reasons: string[];
};

export type DemoSeedReport = Record<DemoSeedTable, DemoSeedCounter>;

export type DemoWorkspaceTier = 'large' | 'medium' | 'small';

export type DemoWorkspaceSpec = {
  index: number;
  tier: DemoWorkspaceTier;
  slug: string;
  name: string;
  ownerUserIndex: number;
  memberUserIndexes: number[];
  projectCount: number;
  taskCount: number;
};

export type DemoProjectSpec = {
  workspaceIndex: number;
  projectIndex: number;
  key: string;
  name: string;
  taskCount: number;
  sprintCount: number;
};

export type DemoSprintSpec = {
  workspaceIndex: number;
  projectIndex: number;
  sprintIndex: number;
  name: string;
  goal: string;
  status: SprintStatus;
  startAt: Date;
  endAt: Date;
  completedAt: Date | null;
};

export type DemoTaskSpec = {
  workspaceIndex: number;
  projectIndex: number;
  taskIndex: number;
  projectSeq: number;
  title: string;
  description: string;
  statusIndex: number;
  priorityIndex: number;
  sprintIndex: number | null;
  reporterUserIndex: number;
  assigneeUserIndex: number | null;
  startAt: Date | null;
  dueAt: Date | null;
  completedAt: Date | null;
  estimateMinutes: number;
};

export type DemoUserRoleSpec = {
  userIndex: number;
  roleName: RoleName;
};
