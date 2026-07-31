import Decimal from 'decimal.js';
import {
  POSITION_SCALE,
  POSITION_STEP,
} from 'src/modules/task_position/utils/task-position.util';
import { DEMO_SEED_CONFIG } from './demo-seed.config';
import { DEMO_SEED_KEY, DEMO_SEED_MARKER } from './demo-seed.constants';
import {
  DemoSeedCounter,
  DemoSeedReport,
  DemoSeedTable,
} from './demo-seed.types';

const TABLES: DemoSeedTable[] = [
  'plans',
  'features',
  'planFeatures',
  'permissions',
  'users',
  'userProfiles',
  'subscriptions',
  'subscriptionWorkspaces',
  'workspaces',
  'usageLimits',
  'workspaceFeatureSettings',
  'roles',
  'rolePermissions',
  'workspaceMembers',
  'userRoles',
  'projects',
  'boards',
  'taskStatuses',
  'taskPriorities',
  'sprints',
  'tasks',
  'taskAssignees',
  'taskPositions',
  'comments',
  'activities',
  'notifications',
  'validations',
];

export function createDemoSeedReport(): DemoSeedReport {
  return TABLES.reduce((report, table) => {
    report[table] = {
      created: 0,
      existing: 0,
      skipped: 0,
      failed: 0,
      reasons: [],
    };
    return report;
  }, {} as DemoSeedReport);
}

export function addReport(
  report: DemoSeedReport,
  table: DemoSeedTable,
  patch: Partial<Omit<DemoSeedCounter, 'reasons'>> & { reason?: string },
): void {
  const counter = report[table];

  counter.created += patch.created ?? 0;
  counter.existing += patch.existing ?? 0;
  counter.skipped += patch.skipped ?? 0;
  counter.failed += patch.failed ?? 0;

  if (patch.reason && !counter.reasons.includes(patch.reason)) {
    counter.reasons.push(patch.reason);
  }
}

export function mergeDemoSeedReport(
  target: DemoSeedReport,
  source: DemoSeedReport,
): void {
  for (const table of TABLES) {
    target[table].created += source[table].created;
    target[table].existing += source[table].existing;
    target[table].skipped += source[table].skipped;
    target[table].failed += source[table].failed;

    for (const reason of source[table].reasons) {
      if (!target[table].reasons.includes(reason)) {
        target[table].reasons.push(reason);
      }
    }
  }
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function padNumber(value: number, length = 3): string {
  return value.toString().padStart(length, '0');
}

export function demoMarker(...parts: string[]): string {
  return `${DEMO_SEED_MARKER}${parts.map((part) => `[${part}]`).join('')}`;
}

export function demoSeedId(...parts: Array<string | number>): string {
  return parts.map((part) => String(part)).join(':');
}

export function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export function seededPosition(index: number): string {
  return new Decimal(index + 1).mul(POSITION_STEP).toFixed(POSITION_SCALE);
}

export function assertDemoSeedSafety(): void {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Demo seed is disabled.');
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.DEMO_SEED_CONFIRM !== 'I_UNDERSTAND'
  ) {
    throw new Error(
      'Production demo seed requires DEMO_SEED_CONFIRM=I_UNDERSTAND.',
    );
  }

  if (process.env.DEMO_SEED_VERSION !== DEMO_SEED_CONFIG.version) {
    throw new Error(`DEMO_SEED_VERSION must be ${DEMO_SEED_CONFIG.version}.`);
  }

  if (process.env.DB_SYNCHRONIZE === 'true') {
    throw new Error('Demo seed refuses to run with DB_SYNCHRONIZE=true.');
  }
}

export function printDemoSeedReport(report: DemoSeedReport): void {
  const totals = Object.values(report).reduce(
    (sum, counter) => ({
      created: sum.created + counter.created,
      existing: sum.existing + counter.existing,
      skipped: sum.skipped + counter.skipped,
      failed: sum.failed + counter.failed,
    }),
    { created: 0, existing: 0, skipped: 0, failed: 0 },
  );

  console.log('');
  console.log(
    totals.failed > 0
      ? 'Demo seed completed with failures'
      : 'Demo seed completed successfully',
  );
  console.log('');
  console.log(`Seed version: ${DEMO_SEED_KEY}`);
  console.log('Transaction strategy: per workspace');
  console.log('');

  for (const table of TABLES) {
    const counter = report[table];
    console.log(
      `${table.padEnd(25)} ${String(counter.created).padStart(5)} created, ${String(
        counter.existing,
      ).padStart(5)} existing, ${String(counter.skipped).padStart(
        5,
      )} skipped, ${String(counter.failed).padStart(5)} failed`,
    );

    for (const reason of counter.reasons) {
      console.log(`  Reason: ${reason}`);
    }
  }

  console.log('');
  console.log(`Total created:  ${String(totals.created).padStart(6)}`);
  console.log(`Total existing: ${String(totals.existing).padStart(6)}`);
  console.log(`Total skipped:  ${String(totals.skipped).padStart(6)}`);
  console.log(`Total failed:   ${String(totals.failed).padStart(6)}`);
}
