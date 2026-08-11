import 'dotenv/config';
import 'reflect-metadata';

import { faker } from '@faker-js/faker';
import {
  DEFAULT_PLAN_LIMITS,
  FREE_PLAN_SLUG,
  PRO_PLAN_SLUG,
} from 'src/modules/billing/constants/default-plan-limits.constant';
import {
  Plan,
  PlanBillingInterval,
} from 'src/modules/billing/domain/entities/plan.entity';
import { SubscriptionWorkspace } from 'src/modules/billing/domain/entities/subscription-workspace.entity';
import {
  BillingProvider,
  Subscription,
  SubscriptionStatus,
} from 'src/modules/billing/domain/entities/subscription.entity';
import {
  UsageLimit,
  UsageResourceType,
} from 'src/modules/billing/domain/entities/usage-limit.entity';
import {
  getNumberLimit,
  mergePlanLimits,
} from 'src/modules/billing/utils/plan-limit.util';
import {
  Board,
  BoardViewType,
} from 'src/modules/boards/domain/entities/board.entity';
import {
  Activity,
  ActivityAction,
  ActivityEntityType,
} from 'src/modules/activity/domain/entities/activity.entity';
import { FeatureKey } from 'src/modules/features/constants/feature-key.constant';
import { Feature } from 'src/modules/features/domain/entities/feature.entity';
import {
  Notification,
  NotificationSenderType,
  NotificationSourceType,
  NotificationType,
} from 'src/modules/notifications/domain/entities/notification.entity';
import {
  PERMISSION_SEED_DATA,
  PermissionCode,
} from 'src/modules/permission/constants/permission.constant';
import { ROLE_PERMISSION_MAP } from 'src/modules/permission/constants/role-permission-map.constant';
import { Permission } from 'src/modules/permission/domain/entities/permission.entity';
import { PlanFeature } from 'src/modules/plan_features/domain/entities/plan_feature.entity';
import {
  Project,
  ProjectVisibility,
} from 'src/modules/projects/domain/entities/project.entity';
import { Role, RoleName } from 'src/modules/role/domain/entities/role.entity';
import { RolePermission } from 'src/modules/role_permission/domain/entities/role_permission.entity';
import {
  Sprint,
  SprintStatus,
} from 'src/modules/sprints/domain/entities/sprint.entity';
import { TaskAssignee } from 'src/modules/task_assignee/domain/entities/task_assignee.entity';
import { TaskComment } from 'src/modules/task_commnent/domain/entities/task_commnent.entity';
import { TaskPosition } from 'src/modules/task_position/domain/entities/task_position.entity';
import { TaskPriority } from 'src/modules/task_priority/domain/entities/task_priority.entity';
import { DEFAULT_TASK_PRIORITIES } from 'src/modules/task_priority/constants/default-task-priority.constant';
import { TaskStatus } from 'src/modules/task_status/domain/entities/task_status.entity';
import { DEFAULT_TASK_STATUSES } from 'src/modules/task_status/constants/default-task-status.constant';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { UserProfile } from 'src/modules/user_profiles/domain/entities/user_profile.entity';
import { UserRole } from 'src/modules/user_roles/domain/entities/user_role.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import {
  SystemRole,
  User,
} from 'src/modules/users/domain/entities/user.entity';
import { WorkspaceFeatureSetting } from 'src/modules/workspace_feature_settings/domain/entities/workspace_feature_setting.entity';
import {
  PlanTypeWorkspace,
  Workspace,
  WorkspaceLayoutMode,
} from 'src/modules/workspaces/domain/entities/workspace.entity';
import { hashPassword } from 'src/utils';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import dataSource from '../data-source';
import { DEMO_SEED_CONFIG } from './demo-seed.config';
import {
  DEMO_SEED_EMAIL_DOMAIN,
  DEMO_SEED_KEY,
  DEMO_SEED_MARKER,
  DEMO_SEED_SLUG_PREFIX,
} from './demo-seed.constants';
import {
  addDays,
  addReport,
  assertDemoSeedSafety,
  chunkArray,
  createDemoSeedReport,
  demoMarker,
  demoSeedId,
  mergeDemoSeedReport,
  padNumber,
  printDemoSeedReport,
  seededPosition,
} from './demo-seed.helper';
import {
  DemoProjectSpec,
  DemoSeedReport,
  DemoSprintSpec,
  DemoTaskSpec,
  DemoWorkspaceSpec,
} from './demo-seed.types';

type WorkspaceSeedState = {
  spec: DemoWorkspaceSpec;
  workspace: Workspace;
  members: User[];
  rolesByName: Map<RoleName, Role>;
  projects: Array<{
    spec: DemoProjectSpec;
    project: Project;
    statuses: TaskStatus[];
    priorities: TaskPriority[];
    sprints: Sprint[];
    tasks: Task[];
  }>;
};

class DemoLargeSeeder {
  private report = createDemoSeedReport();
  private readonly baseDate = new Date(Date.UTC(2026, 6, 1, 0, 0, 0, 0));
  private readonly usersByIndex = new Map<number, User>();
  private readonly workspaceSpecs = this.buildWorkspaceSpecs();
  private readonly demoProOwnerIndexes = this.buildDemoProOwnerIndexes();
  private passwordHash: string | null = null;

  constructor(private readonly ds: DataSource) {}

  async run(): Promise<void> {
    assertDemoSeedSafety();
    faker.seed(DEMO_SEED_CONFIG.fakerSeed);
    this.passwordHash = this.getDemoPasswordHash();

    await this.ds.initialize();

    try {
      await this.seedPrerequisites();
      await this.seedUsers();

      for (const spec of this.workspaceSpecs) {
        const committedReport = this.report;
        const workspaceReport = createDemoSeedReport();

        try {
          this.report = workspaceReport;
          await this.ds.transaction(async (manager) => {
            await this.seedWorkspace(spec, manager);
          });
          mergeDemoSeedReport(committedReport, workspaceReport);
        } catch (error) {
          addReport(committedReport, 'workspaces', {
            failed: 1,
            reason: `workspace ${spec.slug} failed: ${this.formatError(error)}`,
          });
        } finally {
          this.report = committedReport;
        }
      }

      await this.validateSeededData();
      await this.analyzeSeededTables();
      printDemoSeedReport(this.report);
      this.printDemoAccount();
    } finally {
      await this.ds.destroy();
    }
  }

  private getDemoPasswordHash(): string {
    const password = process.env.DEMO_USER_PASSWORD?.trim();

    if (!password) {
      throw new Error('DEMO_USER_PASSWORD is required for demo users.');
    }

    return hashPassword(password);
  }

  private printDemoAccount(): void {
    console.log('');
    console.log(`Main demo account: ${this.userEmail(1)}`);
    console.log('Password: not printed. Use DEMO_USER_PASSWORD from env.');
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private buildWorkspaceSpecs(): DemoWorkspaceSpec[] {
    const specs: DemoWorkspaceSpec[] = [];

    for (let index = 1; index <= DEMO_SEED_CONFIG.workspaceCount; index += 1) {
      const tier =
        index <= DEMO_SEED_CONFIG.largeWorkspaceCount
          ? 'large'
          : index <=
              DEMO_SEED_CONFIG.largeWorkspaceCount +
                DEMO_SEED_CONFIG.mediumWorkspaceCount
            ? 'medium'
            : 'small';
      const memberCount = tier === 'large' ? 10 : tier === 'medium' ? 7 : 4;
      const projectCount =
        tier === 'large' ? 5 : tier === 'medium' ? 3 : index % 2 === 0 ? 2 : 1;
      const taskCount = tier === 'large' ? 70 : tier === 'medium' ? 40 : 9;
      const ownerUserIndex =
        index <= DEMO_SEED_CONFIG.mainDemoWorkspaceCount ? 1 : index + 10;
      const memberUserIndexes = this.buildMemberIndexes(
        index,
        ownerUserIndex,
        memberCount,
      );

      specs.push({
        index,
        tier,
        slug: `${DEMO_SEED_SLUG_PREFIX}-workspace-${padNumber(index)}`,
        name: `${DEMO_SEED_MARKER} ${faker.company.name()} ${padNumber(index)}`,
        ownerUserIndex,
        memberUserIndexes,
        projectCount,
        taskCount,
      });
    }

    return specs;
  }

  private buildMemberIndexes(
    workspaceIndex: number,
    ownerUserIndex: number,
    memberCount: number,
  ): number[] {
    const indexes = [ownerUserIndex];
    let cursor = workspaceIndex * 3;

    while (indexes.length < memberCount) {
      const candidate = ((cursor - 1) % DEMO_SEED_CONFIG.userCount) + 1;

      if (!indexes.includes(candidate)) {
        indexes.push(candidate);
      }

      cursor += 1;
    }

    return indexes;
  }

  private buildDemoProOwnerIndexes(): Set<number> {
    const proOwnerIndexes = new Set<number>();
    const proWorkspaceSpecs = this.workspaceSpecs.slice(
      0,
      DEMO_SEED_CONFIG.proWorkspaceCount,
    );

    for (const spec of proWorkspaceSpecs) {
      proOwnerIndexes.add(spec.ownerUserIndex);
    }

    return proOwnerIndexes;
  }

  private userEmail(index: number): string {
    return `demo.v1.user.${padNumber(index)}@${DEMO_SEED_EMAIL_DOMAIN}`;
  }

  private username(index: number): string {
    return `demo_v1_user_${padNumber(index)}`;
  }

  private async seedPrerequisites(): Promise<void> {
    await this.ds.transaction(async (manager) => {
      await this.seedPlans(manager);
      const sprintFeature = await this.seedSprintFeature(manager);
      await this.seedPlanFeatures(sprintFeature, manager);
      await this.seedPermissions(manager);
    });
  }

  private async seedPlans(manager: EntityManager): Promise<void> {
    const repo = manager.getRepository(Plan);
    const planItems = [
      {
        name: 'FREE',
        slug: FREE_PLAN_SLUG,
        description: 'Basic plan for getting started.',
        priceAmount: 0,
        currency: 'VND',
        billingInterval: PlanBillingInterval.MONTH,
        features: {
          kanban: true,
          [FeatureKey.SPRINT_ENABLED]: true,
          storage: true,
          pageTemplates: true,
        },
        limits: DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG],
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'PRO',
        slug: PRO_PLAN_SLUG,
        description: 'Monthly pro plan for growing workspaces.',
        priceAmount: 99000,
        currency: 'VND',
        billingInterval: PlanBillingInterval.MONTH,
        features: {
          kanban: true,
          [FeatureKey.SPRINT_ENABLED]: true,
          storage: true,
          pageTemplates: true,
          upgradedWorkspaces: true,
        },
        limits: DEFAULT_PLAN_LIMITS[PRO_PLAN_SLUG],
        isActive: true,
        sortOrder: 2,
      },
    ];
    const existing = await repo.find({
      where: { slug: In(planItems.map((item) => item.slug)) },
      withDeleted: true,
    });
    const existingBySlug = new Map(existing.map((item) => [item.slug, item]));
    const toCreate: Plan[] = [];

    for (const item of planItems) {
      const existed = existingBySlug.get(item.slug);

      if (existed) {
        addReport(this.report, 'plans', { existing: 1 });
        continue;
      }

      toCreate.push(repo.create(item));
    }

    await this.saveCreated(repo, toCreate, 'plans');
  }

  private async seedSprintFeature(manager: EntityManager): Promise<Feature> {
    const repo = manager.getRepository(Feature);
    const code = FeatureKey.SPRINT_ENABLED.toLowerCase();
    let feature = await repo
      .createQueryBuilder('feature')
      .withDeleted()
      .where('LOWER(feature.code) = :code', { code })
      .orWhere('LOWER(feature.code) = :legacyCode', { legacyCode: 'sprint' })
      .getOne();

    if (feature) {
      addReport(this.report, 'features', { existing: 1 });

      if (feature.deletedAt) {
        feature.deletedAt = null;
        feature.isActive = true;
        await repo.save(feature);
      }

      return feature;
    }

    feature = await repo.save(
      repo.create({
        code,
        name: 'Sprint',
        description: 'Enable sprint planning and backlog workflows.',
        category: 'agile',
        isActive: true,
        metadata: { seedKey: DEMO_SEED_KEY },
      }),
    );
    addReport(this.report, 'features', { created: 1 });

    return feature;
  }

  private async seedPlanFeatures(
    sprintFeature: Feature,
    manager: EntityManager,
  ): Promise<void> {
    const planRepo = manager.getRepository(Plan);
    const repo = manager.getRepository(PlanFeature);
    const plans = await planRepo.find({
      where: { slug: In([FREE_PLAN_SLUG, PRO_PLAN_SLUG]) },
    });
    const existing = await repo.find({
      where: {
        planId: In(plans.map((plan) => plan.id)),
        featureId: sprintFeature.id,
      },
      withDeleted: true,
    });
    const existingKeys = new Set(
      existing.map((item) => `${item.planId}:${item.featureId}`),
    );
    const toCreate: PlanFeature[] = [];

    for (const plan of plans) {
      const key = `${plan.id}:${sprintFeature.id}`;

      if (existingKeys.has(key)) {
        addReport(this.report, 'planFeatures', { existing: 1 });
        continue;
      }

      toCreate.push(
        repo.create({
          planId: plan.id,
          featureId: sprintFeature.id,
          enabled: plan.features?.[sprintFeature.code] === true,
          metadata: { seedKey: DEMO_SEED_KEY },
        }),
      );
    }

    await this.saveCreated(repo, toCreate, 'planFeatures');
  }

  private async seedPermissions(manager: EntityManager): Promise<void> {
    const repo = manager.getRepository(Permission);
    const codes = PERMISSION_SEED_DATA.map((item) => item.code);
    const existing = await repo.find({ where: { code: In(codes) } });
    const existingCodes = new Set(existing.map((item) => item.code));
    const toCreate = PERMISSION_SEED_DATA.filter(
      (item) => !existingCodes.has(item.code),
    ).map((item) =>
      repo.create({
        code: item.code,
        description: item.description,
      }),
    );

    addReport(this.report, 'permissions', {
      existing: existing.length,
    });
    await this.saveCreated(repo, toCreate, 'permissions');
  }

  private async seedUsers(): Promise<void> {
    await this.ds.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(UserProfile);
      const emails = Array.from(
        { length: DEMO_SEED_CONFIG.userCount },
        (_, index) => this.userEmail(index + 1),
      );
      const usernames = Array.from(
        { length: DEMO_SEED_CONFIG.userCount },
        (_, index) => this.username(index + 1),
      );
      const existingUsers = await userRepo.find({
        where: [{ email: In(emails) }, { username: In(usernames) }],
      });
      const byEmail = new Map(existingUsers.map((user) => [user.email, user]));
      const byUsername = new Map(
        existingUsers.map((user) => [user.username, user]),
      );
      const toCreate: User[] = [];

      for (let index = 1; index <= DEMO_SEED_CONFIG.userCount; index += 1) {
        const email = this.userEmail(index);
        const username = this.username(index);
        const existingByEmail = byEmail.get(email);
        const existingByUsername = byUsername.get(username);

        if (existingByEmail) {
          this.usersByIndex.set(index, existingByEmail);
          addReport(this.report, 'users', { existing: 1 });
          continue;
        }

        if (existingByUsername) {
          addReport(this.report, 'users', {
            skipped: 1,
            reason: `username conflict for ${username}`,
          });
          continue;
        }

        toCreate.push(
          userRepo.create({
            email,
            username,
            googleId: null,
            avatarUrl: null,
            passwordHash: this.passwordHash,
            isActive: true,
            isEmailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            systemRole: index === 1 ? SystemRole.SYSTEM_ADMIN : SystemRole.USER,
          }),
        );
      }

      const created = await this.saveCreated(userRepo, toCreate, 'users');

      for (const user of created) {
        const match = /demo\.v1\.user\.(\d{3})@/.exec(user.email);
        if (match) {
          this.usersByIndex.set(Number(match[1]), user);
        }
      }

      await this.seedUserProfiles(profileRepo);
    });
  }

  private async seedUserProfiles(
    profileRepo: Repository<UserProfile>,
  ): Promise<void> {
    const users = [...this.usersByIndex.entries()];
    const existingProfiles = await profileRepo.find({
      where: { userId: In(users.map(([, user]) => user.id)) },
    });
    const existingUserIds = new Set(
      existingProfiles.map((profile) => profile.userId),
    );
    const toCreate: UserProfile[] = [];

    for (const [index, user] of users) {
      if (existingUserIds.has(user.id)) {
        addReport(this.report, 'userProfiles', { existing: 1 });
        continue;
      }

      const fullName = faker.person.fullName();
      toCreate.push(
        profileRepo.create({
          userId: user.id,
          displayName: fullName,
          fullName,
          bio: `${DEMO_SEED_MARKER} Demo user for task management workflows.`,
          phoneNumber: null,
          location: index % 2 === 0 ? 'Ho Chi Minh City' : 'Ha Noi',
          jobTitle: this.pick(
            [
              'Product Manager',
              'Backend Engineer',
              'Frontend Engineer',
              'QA Engineer',
              'UX Designer',
              'Scrum Master',
            ],
            index,
          ),
          website: null,
          coverUrl: null,
          timezone: 'Asia/Bangkok',
          language: 'vi',
        }),
      );
    }

    await this.saveCreated(profileRepo, toCreate, 'userProfiles');
  }

  private async seedWorkspace(
    spec: DemoWorkspaceSpec,
    manager: EntityManager,
  ): Promise<void> {
    const workspace = await this.seedOneWorkspace(spec, manager);
    const billingPlan = await this.syncWorkspaceBillingState(
      spec,
      workspace,
      manager,
    );
    const rolesByName = await this.seedRolesAndRolePermissions(
      workspace,
      manager,
    );
    const members = await this.seedWorkspaceMembers(
      spec,
      workspace,
      rolesByName,
      manager,
    );
    await this.seedWorkspaceFeatureSetting(workspace, spec, manager);

    const state: WorkspaceSeedState = {
      spec,
      workspace,
      members,
      rolesByName,
      projects: [],
    };

    const projectSpecs = this.buildProjectSpecs(spec);

    for (const projectSpec of projectSpecs) {
      const projectState = await this.seedProjectGraph(
        state,
        projectSpec,
        manager,
      );
      state.projects.push(projectState);
    }

    await this.seedUsageLimits(state, billingPlan, manager);
  }

  private async seedOneWorkspace(
    spec: DemoWorkspaceSpec,
    manager: EntityManager,
  ): Promise<Workspace> {
    const repo = manager.getRepository(Workspace);
    const owner = this.usersByIndex.get(spec.ownerUserIndex);

    if (!owner) {
      throw new Error(`Owner user ${spec.ownerUserIndex} missing`);
    }

    let workspace = await repo.findOne({
      where: { slug: spec.slug },
      withDeleted: true,
    });

    if (workspace) {
      addReport(this.report, 'workspaces', { existing: 1 });

      if (workspace.deletedAt) {
        workspace.deletedAt = null;
        workspace.deletedBy = null;
        await repo.save(workspace);
      }

      return workspace;
    }

    workspace = await repo.save(
      repo.create({
        name: spec.name,
        slug: spec.slug,
        planType: PlanTypeWorkspace.FREE,
        layoutMode: WorkspaceLayoutMode.TABS,
        createdBy: owner.id,
        deletedAt: null,
        deletedBy: null,
      }),
    );
    addReport(this.report, 'workspaces', { created: 1 });

    return workspace;
  }

  private async syncWorkspaceBillingState(
    spec: DemoWorkspaceSpec,
    workspace: Workspace,
    manager: EntityManager,
  ): Promise<Plan> {
    const planRepo = manager.getRepository(Plan);
    const plans = await planRepo.find({
      where: {
        slug: In([FREE_PLAN_SLUG, PRO_PLAN_SLUG]),
        isActive: true,
      },
    });
    const planBySlug = new Map(plans.map((plan) => [plan.slug, plan]));
    const freePlan = planBySlug.get(FREE_PLAN_SLUG);
    const proPlan = planBySlug.get(PRO_PLAN_SLUG);
    const isProWorkspace = proPlan
      ? this.isDemoProWorkspace(spec, proPlan)
      : false;
    const plan = isProWorkspace ? proPlan : freePlan;

    if (!plan) {
      const planSlug = isProWorkspace ? PRO_PLAN_SLUG : FREE_PLAN_SLUG;
      throw new Error(`Plan ${planSlug} is missing`);
    }

    const expectedPlanType = isProWorkspace
      ? PlanTypeWorkspace.PRO
      : PlanTypeWorkspace.FREE;

    if (workspace.planType !== expectedPlanType) {
      workspace.planType = expectedPlanType;
      await manager.getRepository(Workspace).save(workspace);
    }

    if (isProWorkspace) {
      await this.seedDemoSubscriptionWorkspace(spec, workspace, plan, manager);
    } else {
      await this.detachDemoSubscriptionWorkspace(workspace, manager);
    }

    return plan;
  }

  private isDemoProWorkspace(spec: DemoWorkspaceSpec, plan: Plan): boolean {
    if (!this.demoProOwnerIndexes.has(spec.ownerUserIndex)) {
      return false;
    }

    const limits = mergePlanLimits(plan);
    const upgradedWorkspaces = getNumberLimit(limits, 'upgradedWorkspaces', 1);

    if (upgradedWorkspaces <= 0) {
      return false;
    }

    const selectedWorkspaceRank = this.workspaceSpecs
      .filter(
        (item) =>
          item.ownerUserIndex === spec.ownerUserIndex &&
          item.index <= DEMO_SEED_CONFIG.proWorkspaceCount,
      )
      .findIndex((item) => item.index === spec.index);

    return (
      selectedWorkspaceRank >= 0 &&
      selectedWorkspaceRank + 1 <= upgradedWorkspaces
    );
  }

  private async seedDemoSubscriptionWorkspace(
    spec: DemoWorkspaceSpec,
    workspace: Workspace,
    plan: Plan,
    manager: EntityManager,
  ): Promise<void> {
    const owner = this.usersByIndex.get(spec.ownerUserIndex);

    if (!owner) {
      throw new Error(`Owner user ${spec.ownerUserIndex} missing`);
    }

    const subscriptionRepo = manager.getRepository(Subscription);
    const subscriptionWorkspaceRepo = manager.getRepository(
      SubscriptionWorkspace,
    );
    const subscriptionSeedId = demoSeedId('subscription-owner', owner.id);
    const currentPeriodStart = this.baseDate;
    const currentPeriodEnd = new Date(Date.UTC(2099, 11, 31, 23, 59, 59, 0));

    let subscription = await subscriptionRepo
      .createQueryBuilder('subscription')
      .where("subscription.metadata ->> 'seedKey' = :seedKey", {
        seedKey: DEMO_SEED_KEY,
      })
      .andWhere("subscription.metadata ->> 'seedId' = :seedId", {
        seedId: subscriptionSeedId,
      })
      .getOne();

    if (subscription) {
      subscription.userId = owner.id;
      subscription.planId = plan.id;
      subscription.provider = BillingProvider.MANUAL;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.currentPeriodStart = currentPeriodStart;
      subscription.currentPeriodEnd = currentPeriodEnd;
      subscription.trialEnd = null;
      subscription.amount = plan.priceAmount;
      subscription.currency = plan.currency;
      subscription.billingInterval = plan.billingInterval;
      subscription.cancelAtPeriodEnd = false;
      subscription.cancelledAt = null;
      subscription.metadata = {
        ...(subscription.metadata ?? {}),
        seedKey: DEMO_SEED_KEY,
        seedId: subscriptionSeedId,
        planSlug: plan.slug,
        amount: plan.priceAmount,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        workspaceIds: this.mergeWorkspaceIds(
          subscription.metadata?.workspaceIds,
          workspace.id,
        ),
      };
      await subscriptionRepo.save(subscription);
      addReport(this.report, 'subscriptions', { existing: 1 });
    } else {
      subscription = await subscriptionRepo.save(
        subscriptionRepo.create({
          userId: owner.id,
          planId: plan.id,
          provider: BillingProvider.MANUAL,
          providerSubscriptionId: null,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart,
          currentPeriodEnd,
          trialEnd: null,
          amount: plan.priceAmount,
          currency: plan.currency,
          billingInterval: plan.billingInterval,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          metadata: {
            seedKey: DEMO_SEED_KEY,
            seedId: subscriptionSeedId,
            planSlug: plan.slug,
            amount: plan.priceAmount,
            currency: plan.currency,
            billingInterval: plan.billingInterval,
            workspaceIds: [workspace.id],
          },
        }),
      );
      addReport(this.report, 'subscriptions', { created: 1 });
    }

    const existingSubscriptionWorkspace =
      await subscriptionWorkspaceRepo.findOne({
        where: {
          workspaceId: workspace.id,
        },
      });

    if (existingSubscriptionWorkspace) {
      if (existingSubscriptionWorkspace.subscriptionId === subscription.id) {
        addReport(this.report, 'subscriptionWorkspaces', { existing: 1 });
        return;
      }

      const linkedSubscription = await subscriptionRepo.findOne({
        where: {
          id: existingSubscriptionWorkspace.subscriptionId,
        },
      });

      if (linkedSubscription?.metadata?.seedKey !== DEMO_SEED_KEY) {
        addReport(this.report, 'subscriptionWorkspaces', {
          skipped: 1,
          reason: `workspace ${workspace.slug} already has a non-demo subscription`,
        });
        return;
      }

      existingSubscriptionWorkspace.subscriptionId = subscription.id;
      existingSubscriptionWorkspace.activatedAt = currentPeriodStart;
      await subscriptionWorkspaceRepo.save(existingSubscriptionWorkspace);
      addReport(this.report, 'subscriptionWorkspaces', { existing: 1 });
      return;
    }

    await subscriptionWorkspaceRepo.save(
      subscriptionWorkspaceRepo.create({
        subscriptionId: subscription.id,
        workspaceId: workspace.id,
        activatedAt: currentPeriodStart,
      }),
    );
    addReport(this.report, 'subscriptionWorkspaces', { created: 1 });
  }

  private async detachDemoSubscriptionWorkspace(
    workspace: Workspace,
    manager: EntityManager,
  ): Promise<void> {
    const subscriptionRepo = manager.getRepository(Subscription);
    const subscriptionWorkspaceRepo = manager.getRepository(
      SubscriptionWorkspace,
    );
    const subscriptionWorkspace = await subscriptionWorkspaceRepo.findOne({
      where: {
        workspaceId: workspace.id,
      },
    });

    if (!subscriptionWorkspace) {
      return;
    }

    const subscription = await subscriptionRepo.findOne({
      where: {
        id: subscriptionWorkspace.subscriptionId,
      },
    });

    if (subscription?.metadata?.seedKey !== DEMO_SEED_KEY) {
      return;
    }

    await subscriptionWorkspaceRepo.remove(subscriptionWorkspace);
  }

  private mergeWorkspaceIds(value: unknown, workspaceId: string): string[] {
    const workspaceIds = new Set<string>();

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string') {
          workspaceIds.add(item);
        }
      });
    }

    workspaceIds.add(workspaceId);

    return [...workspaceIds];
  }

  private async seedRolesAndRolePermissions(
    workspace: Workspace,
    manager: EntityManager,
  ): Promise<Map<RoleName, Role>> {
    const roleRepo = manager.getRepository(Role);
    const rolePermissionRepo = manager.getRepository(RolePermission);
    const permissionRepo = manager.getRepository(Permission);
    const existingRoles = await roleRepo.find({
      where: { workspace_id: workspace.id },
    });
    const rolesByName = new Map(existingRoles.map((role) => [role.name, role]));
    const rolesToCreate = Object.values(RoleName)
      .filter((roleName) => !rolesByName.has(roleName))
      .map((roleName) =>
        roleRepo.create({
          workspace_id: workspace.id,
          name: roleName,
        }),
      );
    const createdRoles = await this.saveCreated(
      roleRepo,
      rolesToCreate,
      'roles',
    );

    addReport(this.report, 'roles', {
      existing: existingRoles.length,
    });

    for (const role of createdRoles) {
      rolesByName.set(role.name, role);
    }

    const permissions = await permissionRepo.find();
    const permissionByCode = new Map(
      permissions.map((permission) => [permission.code, permission]),
    );
    const existingRolePermissions = await rolePermissionRepo.find({
      where: { role_id: In([...rolesByName.values()].map((role) => role.id)) },
    });
    const existingKeys = new Set(
      existingRolePermissions.map(
        (item) => `${item.role_id}:${item.permission_id}`,
      ),
    );
    const rolePermissionsToCreate: RolePermission[] = [];

    for (const [roleName, permissionCodes] of Object.entries(
      ROLE_PERMISSION_MAP,
    ) as [RoleName, PermissionCode[]][]) {
      const role = rolesByName.get(roleName);
      if (!role) continue;

      for (const permissionCode of permissionCodes) {
        const permission = permissionByCode.get(permissionCode);
        if (!permission) {
          addReport(this.report, 'rolePermissions', {
            skipped: 1,
            reason: `missing permission ${permissionCode}`,
          });
          continue;
        }

        const key = `${role.id}:${permission.id}`;
        if (existingKeys.has(key)) {
          addReport(this.report, 'rolePermissions', { existing: 1 });
          continue;
        }

        rolePermissionsToCreate.push(
          rolePermissionRepo.create({
            role_id: role.id,
            permission_id: permission.id,
          }),
        );
      }
    }

    await this.saveCreated(
      rolePermissionRepo,
      rolePermissionsToCreate,
      'rolePermissions',
    );

    return rolesByName;
  }

  private async seedWorkspaceMembers(
    spec: DemoWorkspaceSpec,
    workspace: Workspace,
    rolesByName: Map<RoleName, Role>,
    manager: EntityManager,
  ): Promise<User[]> {
    const userWorkspaceRepo = manager.getRepository(UserWorkspace);
    const userRoleRepo = manager.getRepository(UserRole);
    const members = spec.memberUserIndexes
      .map((index) => this.usersByIndex.get(index))
      .filter((user): user is User => Boolean(user));
    const existingMemberships = await userWorkspaceRepo.find({
      where: {
        workspace_id: workspace.id,
        user_id: In(members.map((user) => user.id)),
      },
    });
    const existingMembershipKeys = new Set(
      existingMemberships.map((item) => `${item.workspace_id}:${item.user_id}`),
    );
    const membershipsToCreate: UserWorkspace[] = [];

    for (const user of members) {
      const key = `${workspace.id}:${user.id}`;

      if (existingMembershipKeys.has(key)) {
        addReport(this.report, 'workspaceMembers', { existing: 1 });
        continue;
      }

      membershipsToCreate.push(
        userWorkspaceRepo.create({
          workspace_id: workspace.id,
          user_id: user.id,
          lastOpenedAt: null,
        }),
      );
    }

    await this.saveCreated(
      userWorkspaceRepo,
      membershipsToCreate,
      'workspaceMembers',
    );

    const roleAssignments = this.buildRoleAssignments(spec, members);
    const existingUserRoles = await userRoleRepo.find({
      where: {
        workspace_id: workspace.id,
        user_id: In(members.map((user) => user.id)),
      },
    });
    const existingUserRoleKeys = new Set(
      existingUserRoles.map(
        (item) => `${item.user_id}:${item.workspace_id}:${item.role_id}`,
      ),
    );
    const userRolesToCreate: UserRole[] = [];

    for (const assignment of roleAssignments) {
      const user = this.usersByIndex.get(assignment.userIndex);
      const role = rolesByName.get(assignment.roleName);

      if (!user || !role) continue;

      const key = `${user.id}:${workspace.id}:${role.id}`;

      if (existingUserRoleKeys.has(key)) {
        addReport(this.report, 'userRoles', { existing: 1 });
        continue;
      }

      userRolesToCreate.push(
        userRoleRepo.create({
          user_id: user.id,
          workspace_id: workspace.id,
          role_id: role.id,
          assigned_by: this.usersByIndex.get(spec.ownerUserIndex)?.id ?? null,
        }),
      );
    }

    await this.saveCreated(userRoleRepo, userRolesToCreate, 'userRoles');

    return members;
  }

  private buildRoleAssignments(
    spec: DemoWorkspaceSpec,
    members: User[],
  ): Array<{ userIndex: number; roleName: RoleName }> {
    return members.map((user, memberOffset) => {
      const match = /demo_v1_user_(\d{3})/.exec(user.username);
      const userIndex = match ? Number(match[1]) : spec.ownerUserIndex;

      if (userIndex === spec.ownerUserIndex) {
        return { userIndex, roleName: RoleName.OWNER };
      }

      if (memberOffset === 1) {
        return { userIndex, roleName: RoleName.ADMIN };
      }

      if (memberOffset === members.length - 1 && spec.tier !== 'small') {
        return { userIndex, roleName: RoleName.VIEWER };
      }

      return { userIndex, roleName: RoleName.MEMBER };
    });
  }

  private async seedWorkspaceFeatureSetting(
    workspace: Workspace,
    spec: DemoWorkspaceSpec,
    manager: EntityManager,
  ): Promise<void> {
    const featureRepo = manager.getRepository(Feature);
    const repo = manager.getRepository(WorkspaceFeatureSetting);
    const feature = await featureRepo
      .createQueryBuilder('feature')
      .where('LOWER(feature.code) = :code', {
        code: FeatureKey.SPRINT_ENABLED.toLowerCase(),
      })
      .getOne();

    if (!feature) {
      addReport(this.report, 'workspaceFeatureSettings', {
        skipped: 1,
        reason: 'sprint feature not found',
      });
      return;
    }

    const existed = await repo.findOne({
      where: {
        workspaceId: workspace.id,
        featureId: feature.id,
      },
      withDeleted: true,
    });

    if (existed) {
      addReport(this.report, 'workspaceFeatureSettings', { existing: 1 });

      if (existed.deletedAt) {
        existed.deletedAt = null;
        existed.enabled = true;
        existed.updatedBy =
          this.usersByIndex.get(spec.ownerUserIndex)?.id ?? null;
        await repo.save(existed);
      }

      return;
    }

    await repo.save(
      repo.create({
        workspaceId: workspace.id,
        featureId: feature.id,
        enabled: true,
        createdBy: this.usersByIndex.get(spec.ownerUserIndex)?.id ?? null,
        updatedBy: null,
        metadata: { seedKey: DEMO_SEED_KEY },
      }),
    );
    addReport(this.report, 'workspaceFeatureSettings', { created: 1 });
  }

  private buildProjectSpecs(spec: DemoWorkspaceSpec): DemoProjectSpec[] {
    const counts = this.distribute(spec.taskCount, spec.projectCount);

    return Array.from({ length: spec.projectCount }, (_, index) => {
      const projectIndex = index + 1;

      return {
        workspaceIndex: spec.index,
        projectIndex,
        key: `DV1W${padNumber(spec.index, 2)}P${padNumber(projectIndex, 2)}`,
        name: `${DEMO_SEED_MARKER} ${this.pick(
          ['Platform', 'Mobile', 'Billing', 'Analytics', 'Operations'],
          spec.index + projectIndex,
        )} ${padNumber(spec.index, 2)}-${padNumber(projectIndex, 2)}`,
        taskCount: counts[index],
        sprintCount:
          spec.tier === 'small'
            ? projectIndex === 1
              ? 1
              : 0
            : projectIndex === 1
              ? 3
              : 2,
      };
    });
  }

  private async seedProjectGraph(
    state: WorkspaceSeedState,
    projectSpec: DemoProjectSpec,
    manager: EntityManager,
  ): Promise<WorkspaceSeedState['projects'][number]> {
    const project = await this.seedProject(state, projectSpec, manager);
    const board = await this.seedBoard(state, project, manager);
    const statuses = await this.seedTaskStatuses(
      state.workspace,
      project,
      manager,
    );
    const priorities = await this.seedTaskPriorities(
      state.workspace,
      project,
      manager,
    );
    const sprints = await this.seedSprints(
      state,
      project,
      projectSpec,
      manager,
    );
    const tasks = await this.seedTasks(
      state,
      project,
      projectSpec,
      statuses,
      priorities,
      sprints,
      manager,
    );

    await this.seedTaskAssignees(state, tasks, manager);
    await this.seedTaskPositions(project, tasks, manager);
    await this.seedComments(state, tasks, manager);
    await this.seedActivities(state, project, sprints, tasks, board, manager);
    await this.seedNotifications(state, tasks, manager);

    return {
      spec: projectSpec,
      project,
      statuses,
      priorities,
      sprints,
      tasks,
    };
  }

  private async seedProject(
    state: WorkspaceSeedState,
    spec: DemoProjectSpec,
    manager: EntityManager,
  ): Promise<Project> {
    const repo = manager.getRepository(Project);
    let project = await repo.findOne({
      where: { workspace_id: state.workspace.id, key: spec.key },
      withDeleted: true,
    });

    if (project) {
      addReport(this.report, 'projects', { existing: 1 });

      if (project.deleted_at) {
        project.deleted_at = null;
        project.deleted_by = null;
        await repo.save(project);
      }

      return project;
    }

    project = await repo.save(
      repo.create({
        workspace_id: state.workspace.id,
        name: spec.name,
        key: spec.key,
        visibility: ProjectVisibility.INTERNAL,
        task_seq: 0,
        created_by: this.usersByIndex.get(state.spec.ownerUserIndex)!.id,
        deleted_at: null,
        deleted_by: null,
      }),
    );
    addReport(this.report, 'projects', { created: 1 });

    return project;
  }

  private async seedBoard(
    state: WorkspaceSeedState,
    project: Project,
    manager: EntityManager,
  ): Promise<Board> {
    const repo = manager.getRepository(Board);
    const name = `${DEMO_SEED_MARKER} Board`;
    let board = await repo.findOne({
      where: { projectId: project.id, name },
      withDeleted: true,
    });

    if (board) {
      addReport(this.report, 'boards', { existing: 1 });

      if (board.deletedAt) {
        board.deletedAt = null;
        board.deletedBy = null;
        await repo.save(board);
      }

      return board;
    }

    board = await repo.save(
      repo.create({
        workspaceId: state.workspace.id,
        projectId: project.id,
        name,
        viewType: BoardViewType.BOARD,
        createdBy: this.usersByIndex.get(state.spec.ownerUserIndex)!.id,
        updatedBy: null,
        deletedAt: null,
        deletedBy: null,
      }),
    );
    addReport(this.report, 'boards', { created: 1 });

    return board;
  }

  private async seedTaskStatuses(
    workspace: Workspace,
    project: Project,
    manager: EntityManager,
  ): Promise<TaskStatus[]> {
    const repo = manager.getRepository(TaskStatus);
    const names = DEFAULT_TASK_STATUSES.map((item) => item.name);
    const existing = await repo.find({
      where: {
        projectId: project.id,
        name: In(names),
      },
    });
    const byName = new Map(existing.map((item) => [item.name, item]));
    const toCreate = DEFAULT_TASK_STATUSES.filter(
      (item) => !byName.has(item.name),
    ).map((item) =>
      repo.create({
        workspaceId: workspace.id,
        projectId: project.id,
        ...item,
      }),
    );
    const created = await this.saveCreated(repo, toCreate, 'taskStatuses');

    addReport(this.report, 'taskStatuses', { existing: existing.length });

    return [...existing, ...created].sort((a, b) => a.position - b.position);
  }

  private async seedTaskPriorities(
    workspace: Workspace,
    project: Project,
    manager: EntityManager,
  ): Promise<TaskPriority[]> {
    const repo = manager.getRepository(TaskPriority);
    const names = DEFAULT_TASK_PRIORITIES.map((item) => item.name);
    const existing = await repo.find({
      where: {
        projectId: project.id,
        name: In(names),
      },
    });
    const byName = new Map(existing.map((item) => [item.name, item]));
    const toCreate = DEFAULT_TASK_PRIORITIES.filter(
      (item) => !byName.has(item.name),
    ).map((item) =>
      repo.create({
        workspaceId: workspace.id,
        projectId: project.id,
        ...item,
      }),
    );
    const created = await this.saveCreated(repo, toCreate, 'taskPriorities');

    addReport(this.report, 'taskPriorities', { existing: existing.length });

    return [...existing, ...created].sort((a, b) => a.level - b.level);
  }

  private async seedSprints(
    state: WorkspaceSeedState,
    project: Project,
    projectSpec: DemoProjectSpec,
    manager: EntityManager,
  ): Promise<Sprint[]> {
    if (projectSpec.sprintCount === 0) return [];

    const repo = manager.getRepository(Sprint);
    const specs = this.buildSprintSpecs(projectSpec);
    const existing = await repo.find({
      where: {
        projectId: project.id,
        name: In(specs.map((item) => item.name)),
      },
      withDeleted: true,
    });
    const byName = new Map(existing.map((item) => [item.name, item]));
    const toCreate: Sprint[] = [];
    const restored: Sprint[] = [];

    for (const spec of specs) {
      const existed = byName.get(spec.name);

      if (existed) {
        addReport(this.report, 'sprints', { existing: 1 });

        if (existed.deletedAt) {
          existed.deletedAt = null;
          existed.deletedBy = null;
          restored.push(existed);
        }

        continue;
      }

      toCreate.push(
        repo.create({
          workspaceId: state.workspace.id,
          projectId: project.id,
          name: spec.name,
          goal: spec.goal,
          status: spec.status,
          startAt: spec.startAt,
          endAt: spec.endAt,
          completedAt: spec.completedAt,
          createdBy: this.usersByIndex.get(state.spec.ownerUserIndex)!.id,
          deletedAt: null,
          deletedBy: null,
        }),
      );
    }

    if (restored.length) {
      await repo.save(restored);
    }

    const created = await this.saveCreated(repo, toCreate, 'sprints');

    return [...existing, ...created].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  private buildSprintSpecs(projectSpec: DemoProjectSpec): DemoSprintSpec[] {
    const statuses =
      projectSpec.sprintCount >= 3
        ? [SprintStatus.COMPLETED, SprintStatus.ACTIVE, SprintStatus.PLANNED]
        : projectSpec.sprintCount === 2
          ? [SprintStatus.ACTIVE, SprintStatus.PLANNED]
          : [SprintStatus.PLANNED];

    return statuses.map((status, index) => {
      const sprintIndex = index + 1;
      const startAt = addDays(this.baseDate, index * 14 - 30);
      const endAt = addDays(startAt, 13);

      return {
        workspaceIndex: projectSpec.workspaceIndex,
        projectIndex: projectSpec.projectIndex,
        sprintIndex,
        name: `${DEMO_SEED_MARKER}[W${padNumber(
          projectSpec.workspaceIndex,
          2,
        )}][P${padNumber(projectSpec.projectIndex, 2)}] Sprint ${padNumber(
          sprintIndex,
          2,
        )}`,
        goal: `${DEMO_SEED_MARKER} ${faker.company.catchPhrase()}`,
        status,
        startAt,
        endAt,
        completedAt: status === SprintStatus.COMPLETED ? endAt : null,
      };
    });
  }

  private async seedTasks(
    state: WorkspaceSeedState,
    project: Project,
    projectSpec: DemoProjectSpec,
    statuses: TaskStatus[],
    priorities: TaskPriority[],
    sprints: Sprint[],
    manager: EntityManager,
  ): Promise<Task[]> {
    const repo = manager.getRepository(Task);
    const specs = this.buildTaskSpecs(state, projectSpec, sprints);
    const existing = await repo.find({
      where: {
        projectId: project.id,
        projectSeq: In(specs.map((item) => item.projectSeq)),
      },
      withDeleted: true,
    });
    const bySeq = new Map(
      existing
        .filter((item) => item.projectSeq !== null)
        .map((item) => [item.projectSeq as number, item]),
    );
    const tasksToCreate: Task[] = [];
    const restored: Task[] = [];
    const reusable: Task[] = [];

    for (const spec of specs) {
      const existed = bySeq.get(spec.projectSeq);
      const status = statuses[spec.statusIndex % statuses.length];
      const priority = priorities[spec.priorityIndex % priorities.length];
      const sprint = spec.sprintIndex ? sprints[spec.sprintIndex - 1] : null;
      const reporter = this.usersByIndex.get(spec.reporterUserIndex);

      if (!reporter) {
        addReport(this.report, 'tasks', {
          skipped: 1,
          reason: `reporter user ${spec.reporterUserIndex} missing`,
        });
        continue;
      }

      if (existed) {
        if (!existed.title?.includes(DEMO_SEED_MARKER)) {
          addReport(this.report, 'tasks', {
            skipped: 1,
            reason: `non-demo task already uses ${project.key}-${spec.projectSeq}`,
          });
          continue;
        }

        addReport(this.report, 'tasks', { existing: 1 });

        if (existed.deletedAt) {
          existed.deletedAt = null;
          existed.deletedBy = null;
          restored.push(existed);
        }

        reusable.push(existed);
        continue;
      }

      tasksToCreate.push(
        repo.create({
          workspaceId: state.workspace.id,
          projectId: project.id,
          parentTaskId: null,
          sprintId: sprint?.id ?? null,
          projectSeq: spec.projectSeq,
          title: spec.title,
          description: spec.description,
          statusId:
            sprint?.status === SprintStatus.COMPLETED
              ? statuses[2].id
              : status.id,
          priorityId: priority.id,
          createdBy: reporter.id,
          startAt: spec.startAt,
          dueAt: spec.dueAt,
          completedAt:
            sprint?.status === SprintStatus.COMPLETED || status.isDone
              ? (spec.completedAt ?? spec.dueAt)
              : null,
          estimateMinutes: spec.estimateMinutes,
          deletedAt: null,
          deletedBy: null,
        }),
      );
    }

    if (restored.length) {
      await repo.save(restored);
    }

    const created = await this.saveCreated(repo, tasksToCreate, 'tasks');
    const allTasks = [...reusable, ...created];
    const maxSeq = Math.max(0, ...allTasks.map((task) => task.projectSeq ?? 0));

    if (maxSeq > 0) {
      await manager
        .getRepository(Project)
        .createQueryBuilder()
        .update(Project)
        .set({ task_seq: () => `GREATEST(task_seq, ${maxSeq})` })
        .where('id = :projectId', { projectId: project.id })
        .execute();
    }

    return allTasks.sort((a, b) => (a.projectSeq ?? 0) - (b.projectSeq ?? 0));
  }

  private buildTaskSpecs(
    state: WorkspaceSeedState,
    projectSpec: DemoProjectSpec,
    sprints: Sprint[],
  ): DemoTaskSpec[] {
    const memberIndexes = state.spec.memberUserIndexes;
    const verbs = [
      'Implement',
      'Review',
      'Document',
      'Refactor',
      'Validate',
      'Automate',
      'Design',
      'Monitor',
    ];
    const domains = [
      'authentication flow',
      'workspace dashboard',
      'billing limits',
      'sprint planning',
      'notification inbox',
      'task filtering',
      'board ordering',
      'member permissions',
    ];

    return Array.from({ length: projectSpec.taskCount }, (_, index) => {
      const taskIndex = index + 1;
      const sprintIndex =
        sprints.length > 0 && taskIndex % 4 !== 0
          ? ((taskIndex - 1) % sprints.length) + 1
          : null;
      const statusIndex = taskIndex % DEFAULT_TASK_STATUSES.length;
      const marker = demoMarker(
        `W${padNumber(projectSpec.workspaceIndex, 2)}`,
        `P${padNumber(projectSpec.projectIndex, 2)}`,
        `T${padNumber(taskIndex)}`,
      );

      return {
        workspaceIndex: projectSpec.workspaceIndex,
        projectIndex: projectSpec.projectIndex,
        taskIndex,
        projectSeq: taskIndex,
        title: `${marker} ${this.pick(verbs, taskIndex)} ${this.pick(
          domains,
          taskIndex + projectSpec.projectIndex,
        )}`,
        description: `${marker} ${faker.lorem.paragraph()}`,
        statusIndex,
        priorityIndex: taskIndex % DEFAULT_TASK_PRIORITIES.length,
        sprintIndex,
        reporterUserIndex: this.pick(memberIndexes, taskIndex),
        assigneeUserIndex:
          taskIndex % 6 === 0 ? null : this.pick(memberIndexes, taskIndex + 2),
        startAt: addDays(this.baseDate, (taskIndex % 45) - 20),
        dueAt: addDays(this.baseDate, (taskIndex % 60) - 15),
        completedAt: addDays(this.baseDate, (taskIndex % 60) - 10),
        estimateMinutes: this.pick([30, 60, 90, 120, 180, 240, 360], taskIndex),
      };
    });
  }

  private async seedTaskAssignees(
    state: WorkspaceSeedState,
    tasks: Task[],
    manager: EntityManager,
  ): Promise<void> {
    if (!tasks.length) return;

    const repo = manager.getRepository(TaskAssignee);
    const existing = await repo.find({
      where: { taskId: In(tasks.map((task) => task.id)) },
    });
    const existingKeys = new Set(
      existing.map((item) => `${item.taskId}:${item.userId}`),
    );
    const memberIds = new Set(state.members.map((user) => user.id));
    const toCreate: TaskAssignee[] = [];

    for (const task of tasks) {
      const assigneeIndex =
        (task.projectSeq ?? 1) % 6 === 0
          ? null
          : this.pick(state.spec.memberUserIndexes, (task.projectSeq ?? 1) + 2);
      const assignee = assigneeIndex
        ? this.usersByIndex.get(assigneeIndex)
        : null;

      if (!assignee) continue;

      if (!memberIds.has(assignee.id)) {
        addReport(this.report, 'taskAssignees', {
          skipped: 1,
          reason: `assignee ${assignee.email} is not workspace member`,
        });
        continue;
      }

      const key = `${task.id}:${assignee.id}`;

      if (existingKeys.has(key)) {
        addReport(this.report, 'taskAssignees', { existing: 1 });
        continue;
      }

      toCreate.push(
        repo.create({
          taskId: task.id,
          userId: assignee.id,
          assignedBy:
            this.usersByIndex.get(state.spec.ownerUserIndex)?.id ?? null,
        }),
      );
    }

    await this.saveCreated(repo, toCreate, 'taskAssignees');
  }

  private async seedTaskPositions(
    project: Project,
    tasks: Task[],
    manager: EntityManager,
  ): Promise<void> {
    if (!tasks.length) return;

    const repo = manager.getRepository(TaskPosition);
    const existing = await repo.find({
      where: { taskId: In(tasks.map((task) => task.id)) },
    });
    const existingKeys = new Set(
      existing.map(
        (item) => `${item.taskId}:${item.context}:${item.contextId}`,
      ),
    );
    const contexts = new Map<string, Task[]>();

    for (const task of tasks) {
      this.addTaskToPositionContext(contexts, 'list', project.id, task);
      this.addTaskToPositionContext(contexts, 'kanban', task.statusId, task);

      if (task.sprintId) {
        this.addTaskToPositionContext(contexts, 'sprint', task.sprintId, task);
      } else {
        this.addTaskToPositionContext(contexts, 'backlog', project.id, task);
      }
    }

    const toCreate: TaskPosition[] = [];

    for (const [contextKey, contextTasks] of contexts.entries()) {
      const [context, contextId] = contextKey.split(':');
      const sortedTasks = contextTasks.sort(
        (a, b) => (a.projectSeq ?? 0) - (b.projectSeq ?? 0),
      );

      for (const [index, task] of sortedTasks.entries()) {
        const key = `${task.id}:${context}:${contextId}`;

        if (existingKeys.has(key)) {
          addReport(this.report, 'taskPositions', { existing: 1 });
          continue;
        }

        toCreate.push(
          repo.create({
            taskId: task.id,
            context: context as TaskPosition['context'],
            contextId,
            position: seededPosition(index),
          }),
        );
      }
    }

    await this.saveCreated(repo, toCreate, 'taskPositions');
  }

  private addTaskToPositionContext(
    contexts: Map<string, Task[]>,
    context: TaskPosition['context'],
    contextId: string,
    task: Task,
  ): void {
    const key = `${context}:${contextId}`;
    const list = contexts.get(key) ?? [];
    list.push(task);
    contexts.set(key, list);
  }

  private async seedComments(
    state: WorkspaceSeedState,
    tasks: Task[],
    manager: EntityManager,
  ): Promise<void> {
    if (!tasks.length) return;

    const repo = manager.getRepository(TaskComment);
    const commentTasks = tasks.filter(
      (task) => (task.projectSeq ?? 0) % 5 === 0,
    );

    if (commentTasks.length === 0) {
      return;
    }

    const existing = await repo
      .createQueryBuilder('comment')
      .where('comment.task_id IN (:...taskIds)', {
        taskIds: commentTasks.map((task) => task.id),
      })
      .andWhere('comment.content LIKE :marker', {
        marker: `${DEMO_SEED_MARKER}%[COMMENT:%`,
      })
      .getMany();
    const existingMarkers = new Set(
      existing.map((comment) => this.extractCommentSeedId(comment.content)),
    );
    const toCreate: TaskComment[] = [];

    for (const task of commentTasks) {
      const seedId = demoSeedId('comment', task.id, 1);

      if (existingMarkers.has(seedId)) {
        addReport(this.report, 'comments', { existing: 1 });
        continue;
      }

      const author =
        this.pick(state.members, (task.projectSeq ?? 1) + state.spec.index) ??
        state.members[0];

      toCreate.push(
        repo.create({
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task.id,
          authorId: author.id,
          content: `${DEMO_SEED_MARKER}[COMMENT:${seedId}] ${faker.lorem.sentences(
            2,
          )}`,
          isEdited: false,
        }),
      );
    }

    await this.saveCreated(repo, toCreate, 'comments');
  }

  private extractCommentSeedId(content: string): string | null {
    const match = /\[COMMENT:([^\]]+)\]/.exec(content);
    return match?.[1] ?? null;
  }

  private async seedActivities(
    state: WorkspaceSeedState,
    project: Project,
    sprints: Sprint[],
    tasks: Task[],
    board: Board,
    manager: EntityManager,
  ): Promise<void> {
    const repo = manager.getRepository(Activity);
    const actorId =
      this.usersByIndex.get(state.spec.ownerUserIndex)?.id ?? null;
    const specs = [
      {
        seedId: demoSeedId('project-created', project.id),
        workspaceId: state.workspace.id,
        projectId: project.id,
        entityType: ActivityEntityType.PROJECT,
        entityId: project.id,
        action: ActivityAction.PROJECT_CREATED,
        metadata: { projectKey: project.key },
      },
      {
        seedId: demoSeedId('board-created', board.id),
        workspaceId: state.workspace.id,
        projectId: project.id,
        entityType: ActivityEntityType.PROJECT,
        entityId: project.id,
        action: ActivityAction.PROJECT_UPDATED,
        metadata: { boardId: board.id },
      },
      ...sprints.slice(0, 2).map((sprint) => ({
        seedId: demoSeedId('sprint', sprint.id, sprint.status),
        workspaceId: state.workspace.id,
        projectId: project.id,
        entityType: ActivityEntityType.SPRINT,
        entityId: sprint.id,
        action:
          sprint.status === SprintStatus.COMPLETED
            ? ActivityAction.SPRINT_COMPLETED
            : sprint.status === SprintStatus.ACTIVE
              ? ActivityAction.SPRINT_STARTED
              : ActivityAction.SPRINT_CREATED,
        metadata: { sprintName: sprint.name, sprintStatus: sprint.status },
      })),
      ...tasks.slice(0, 2).map((task) => ({
        seedId: demoSeedId('task-created', task.id),
        workspaceId: state.workspace.id,
        projectId: project.id,
        entityType: ActivityEntityType.TASK,
        entityId: task.id,
        action: ActivityAction.TASK_CREATED,
        metadata: { taskTitle: task.title, projectSeq: task.projectSeq },
      })),
    ];
    const existing = await repo
      .createQueryBuilder('activity')
      .where("activity.metadata ->> 'seedKey' = :seedKey", {
        seedKey: DEMO_SEED_KEY,
      })
      .andWhere('activity.workspace_id = :workspaceId', {
        workspaceId: state.workspace.id,
      })
      .getMany();
    const existingIds = new Set(
      existing.map((activity) => activity.metadata?.seedId),
    );
    const toCreate = specs
      .filter((spec) => {
        if (existingIds.has(spec.seedId)) {
          addReport(this.report, 'activities', { existing: 1 });
          return false;
        }

        return true;
      })
      .map((spec) =>
        repo.create({
          workspaceId: spec.workspaceId,
          projectId: spec.projectId,
          entityType: spec.entityType,
          entityId: spec.entityId,
          actorId,
          action: spec.action,
          field: null,
          oldValue: null,
          newValue: null,
          metadata: {
            seedKey: DEMO_SEED_KEY,
            seedId: spec.seedId,
            ...spec.metadata,
          },
          isSystem: false,
        }),
      );

    await this.saveCreated(repo, toCreate, 'activities');
  }

  private async seedNotifications(
    state: WorkspaceSeedState,
    tasks: Task[],
    manager: EntityManager,
  ): Promise<void> {
    if (!tasks.length) return;

    const repo = manager.getRepository(Notification);
    const assigneeRepo = manager.getRepository(TaskAssignee);
    const selectedTasks = tasks.filter(
      (task) => (task.projectSeq ?? 0) % 7 === 0,
    );
    const assignees = selectedTasks.length
      ? await assigneeRepo.find({
          where: { taskId: In(selectedTasks.map((task) => task.id)) },
        })
      : [];
    const assigneeByTask = new Map(
      assignees.map((assignee) => [assignee.taskId, assignee]),
    );
    const existing = await repo
      .createQueryBuilder('notification')
      .where("notification.metadata ->> 'seedKey' = :seedKey", {
        seedKey: DEMO_SEED_KEY,
      })
      .andWhere('notification.workspace_id = :workspaceId', {
        workspaceId: state.workspace.id,
      })
      .getMany();
    const existingIds = new Set(
      existing.map((notification) => notification.metadata?.seedId),
    );
    const toCreate: Notification[] = [];

    for (const task of selectedTasks) {
      const assignee = assigneeByTask.get(task.id);
      if (!assignee) continue;

      const seedId = demoSeedId('notification-task-assigned', task.id);

      if (existingIds.has(seedId)) {
        addReport(this.report, 'notifications', { existing: 1 });
        continue;
      }

      toCreate.push(
        repo.create({
          receiverId: assignee.userId,
          senderType: NotificationSenderType.USER,
          actorId: assignee.assignedBy,
          sourceType: NotificationSourceType.TASK,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          taskId: task.id,
          sprintId: task.sprintId,
          commentId: null,
          type: NotificationType.TASK_ASSIGNED,
          title: 'You were assigned a demo task',
          message: task.title,
          actionUrl: `/workspaces/${task.workspaceId}/projects/${task.projectId}/tasks/${task.id}`,
          metadata: {
            seedKey: DEMO_SEED_KEY,
            seedId,
            taskSeq: task.projectSeq,
          },
          readAt: null,
          archivedAt: null,
        }),
      );
    }

    await this.saveCreated(repo, toCreate, 'notifications');
  }

  private async seedUsageLimits(
    state: WorkspaceSeedState,
    plan: Plan,
    manager: EntityManager,
  ): Promise<void> {
    const repo = manager.getRepository(UsageLimit);
    const limits =
      DEFAULT_PLAN_LIMITS[plan.slug] ?? DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG];
    const usedValues: Record<UsageResourceType, number> = {
      [UsageResourceType.MEMBERS]: state.members.length,
      [UsageResourceType.PROJECTS]: state.projects.length,
      [UsageResourceType.TASKS]: state.projects.reduce(
        (sum, item) => sum + item.tasks.length,
        0,
      ),
      [UsageResourceType.PAGES]: 0,
      [UsageResourceType.PAGE_TEMPLATES]: 0,
      [UsageResourceType.STORAGE_MB]: 0,
      [UsageResourceType.ATTACHMENTS]: 0,
      [UsageResourceType.SPRINTS]: state.projects.reduce(
        (sum, item) => sum + item.sprints.length,
        0,
      ),
    };
    const existing = await repo.find({
      where: { workspaceId: state.workspace.id },
    });
    const byResource = new Map(
      existing.map((item) => [item.resourceType, item]),
    );
    const toCreate: UsageLimit[] = [];
    const toUpdate: UsageLimit[] = [];

    for (const resourceType of Object.values(UsageResourceType)) {
      const limitKey = this.resourceLimitKey(resourceType);
      const existed = byResource.get(resourceType);
      const limitValue = limits[limitKey] ?? null;

      if (existed) {
        existed.planId = plan?.id ?? null;
        existed.limitValue = limitValue;
        existed.usedValue = usedValues[resourceType] ?? 0;
        existed.metadata = {
          seedKey: DEMO_SEED_KEY,
          planSlug: plan.slug,
        };
        toUpdate.push(existed);
        addReport(this.report, 'usageLimits', { existing: 1 });
        continue;
      }

      toCreate.push(
        repo.create({
          workspaceId: state.workspace.id,
          planId: plan?.id ?? null,
          resourceType,
          limitValue,
          usedValue: usedValues[resourceType] ?? 0,
          resetAt: null,
          metadata: {
            seedKey: DEMO_SEED_KEY,
            planSlug: plan.slug,
          },
        }),
      );
    }

    if (toUpdate.length) {
      await repo.save(toUpdate, { chunk: DEMO_SEED_CONFIG.batchSize });
    }

    await this.saveCreated(repo, toCreate, 'usageLimits');
  }

  private resourceLimitKey(
    resourceType: UsageResourceType,
  ): keyof (typeof DEFAULT_PLAN_LIMITS)[typeof PRO_PLAN_SLUG] {
    const map: Record<
      UsageResourceType,
      keyof (typeof DEFAULT_PLAN_LIMITS)[typeof PRO_PLAN_SLUG]
    > = {
      [UsageResourceType.MEMBERS]: 'members',
      [UsageResourceType.PROJECTS]: 'projects',
      [UsageResourceType.TASKS]: 'tasks',
      [UsageResourceType.PAGES]: 'pages',
      [UsageResourceType.PAGE_TEMPLATES]: 'pageTemplates',
      [UsageResourceType.STORAGE_MB]: 'storageMb',
      [UsageResourceType.ATTACHMENTS]: 'attachments',
      [UsageResourceType.SPRINTS]: 'sprints',
    };

    return map[resourceType];
  }

  private async validateSeededData(): Promise<void> {
    const checks: Array<{ name: string; sql: string }> = [
      {
        name: 'tasks have projects',
        sql: `
          SELECT COUNT(*)::int AS count
          FROM tasks t
          LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.title LIKE '${DEMO_SEED_MARKER}%'
            AND p.id IS NULL
        `,
      },
      {
        name: 'sprints have projects',
        sql: `
          SELECT COUNT(*)::int AS count
          FROM sprints s
          LEFT JOIN projects p ON p.id = s.project_id
          WHERE s.name LIKE '${DEMO_SEED_MARKER}%'
            AND p.id IS NULL
        `,
      },
      {
        name: 'task reporters are workspace members',
        sql: `
          SELECT COUNT(*)::int AS count
          FROM tasks t
          WHERE t.title LIKE '${DEMO_SEED_MARKER}%'
            AND NOT EXISTS (
              SELECT 1
              FROM user_workspaces uw
              WHERE uw.workspace_id = t.workspace_id
                AND uw.user_id = t.reporter_id
            )
        `,
      },
      {
        name: 'task assignees are workspace members',
        sql: `
          SELECT COUNT(*)::int AS count
          FROM task_assignees ta
          INNER JOIN tasks t ON t.id = ta.task_id
          WHERE t.title LIKE '${DEMO_SEED_MARKER}%'
            AND NOT EXISTS (
              SELECT 1
              FROM user_workspaces uw
              WHERE uw.workspace_id = t.workspace_id
                AND uw.user_id = ta.user_id
            )
        `,
      },
      {
        name: 'task positions use valid context ids',
        sql: `
          SELECT COUNT(*)::int AS count
          FROM task_positions tp
          INNER JOIN tasks t ON t.id = tp.task_id
          WHERE t.title LIKE '${DEMO_SEED_MARKER}%'
            AND (
              (tp.context = 'backlog' AND tp.context_id <> t.project_id)
              OR (tp.context = 'list' AND tp.context_id <> t.project_id)
              OR (tp.context = 'sprint' AND tp.context_id <> t.sprint_id)
              OR (tp.context = 'kanban' AND tp.context_id <> t.status_id)
            )
        `,
      },
      {
        name: 'comments have valid task and author membership',
        sql: `
          SELECT COUNT(*)::int AS count
          FROM task_comments c
          INNER JOIN tasks t ON t.id = c.task_id
          WHERE c.content LIKE '${DEMO_SEED_MARKER}%[COMMENT:%'
            AND NOT EXISTS (
              SELECT 1
              FROM user_workspaces uw
              WHERE uw.workspace_id = c.workspace_id
                AND uw.user_id = c.author_id
            )
        `,
      },
      {
        name: 'user roles belong to same workspace',
        sql: `
          SELECT COUNT(*)::int AS count
          FROM user_roles ur
          INNER JOIN users u ON u.id = ur.user_id
          INNER JOIN roles r ON r.id = ur.role_id
          WHERE u.email LIKE 'demo.v1.user.%@${DEMO_SEED_EMAIL_DOMAIN}'
            AND r.workspace_id <> ur.workspace_id
        `,
      },
    ];

    for (const check of checks) {
      const rows = await this.ds.query(check.sql);
      const count = Number(rows?.[0]?.count ?? 0);

      if (count > 0) {
        addReport(this.report, 'validations', {
          failed: count,
          reason: check.name,
        });
      } else {
        addReport(this.report, 'validations', { existing: 1 });
      }
    }
  }

  private async analyzeSeededTables(): Promise<void> {
    const tables = [
      'users',
      'user_profiles',
      'workspaces',
      'user_workspaces',
      'user_roles',
      'roles',
      'role_permissions',
      'projects',
      'boards',
      'sprints',
      'tasks',
      'task_assignees',
      'task_positions',
      'task_comments',
      'activities',
      'notifications',
      'usage_limits',
      'workspace_feature_settings',
      'user_activities',
      'subscriptions',
      'subscription_workspaces',
    ];

    for (const table of tables) {
      await this.ds.query(`ANALYZE "${table}"`);
    }
  }

  private async saveCreated<T extends object>(
    repo: Repository<T>,
    entities: T[],
    table: Parameters<typeof addReport>[1],
  ): Promise<T[]> {
    if (!entities.length) return [];

    const saved: T[] = [];

    for (const chunk of chunkArray(entities, DEMO_SEED_CONFIG.batchSize)) {
      saved.push(
        ...(await repo.save(chunk, { chunk: DEMO_SEED_CONFIG.batchSize })),
      );
    }

    addReport(this.report, table, { created: entities.length });

    return saved;
  }

  private distribute(total: number, buckets: number): number[] {
    const base = Math.floor(total / buckets);
    const remainder = total % buckets;

    return Array.from(
      { length: buckets },
      (_, index) => base + (index < remainder ? 1 : 0),
    );
  }

  private pick<T>(items: readonly T[], seed: number): T {
    return items[(seed - 1) % items.length];
  }
}

async function bootstrap() {
  const seeder = new DemoLargeSeeder(dataSource);
  await seeder.run();
}

bootstrap().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exitCode = 1;
});
