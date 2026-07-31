import { DEMO_SEED_KEY } from './demo-seed.constants';

export const DEMO_SEED_CONFIG = {
  version: DEMO_SEED_KEY,
  fakerSeed: 2026,
  userCount: 50,
  workspaceCount: 20,
  largeWorkspaceCount: 3,
  mediumWorkspaceCount: 7,
  proWorkspaceCount: 10,
  mainDemoWorkspaceCount: 9,
  targetProjectCount: 51,
  targetSprintCount: 92,
  targetTaskCount: 580,
  targetCommentCount: 120,
  batchSize: 200,
} as const;
