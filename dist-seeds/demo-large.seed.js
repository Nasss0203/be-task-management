/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(1);
__webpack_require__(2);
const faker_1 = __webpack_require__(3);
const default_plan_limits_constant_1 = __webpack_require__(4);
const plan_entity_1 = __webpack_require__(18);
const subscription_workspace_entity_1 = __webpack_require__(19);
const subscription_entity_1 = __webpack_require__(20);
const usage_limit_entity_1 = __webpack_require__(5);
const plan_limit_util_1 = __webpack_require__(21);
const board_entity_1 = __webpack_require__(8);
const activity_entity_1 = __webpack_require__(22);
const feature_key_constant_1 = __webpack_require__(23);
const feature_entity_1 = __webpack_require__(24);
const notification_entity_1 = __webpack_require__(25);
const permission_constant_1 = __webpack_require__(26);
const role_permission_map_constant_1 = __webpack_require__(27);
const permission_entity_1 = __webpack_require__(29);
const plan_feature_entity_1 = __webpack_require__(30);
const project_entity_1 = __webpack_require__(7);
const role_entity_1 = __webpack_require__(28);
const role_permission_entity_1 = __webpack_require__(31);
const sprint_entity_1 = __webpack_require__(12);
const task_assignee_entity_1 = __webpack_require__(14);
const task_commnent_entity_1 = __webpack_require__(32);
const task_position_entity_1 = __webpack_require__(33);
const task_priority_entity_1 = __webpack_require__(15);
const default_task_priority_constant_1 = __webpack_require__(34);
const task_status_entity_1 = __webpack_require__(16);
const default_task_status_constant_1 = __webpack_require__(35);
const task_entity_1 = __webpack_require__(13);
const user_profile_entity_1 = __webpack_require__(10);
const user_role_entity_1 = __webpack_require__(36);
const user_workspace_entity_1 = __webpack_require__(17);
const user_entity_1 = __webpack_require__(9);
const workspace_feature_setting_entity_1 = __webpack_require__(37);
const workspace_entity_1 = __webpack_require__(6);
const utils_1 = __webpack_require__(38);
const typeorm_1 = __webpack_require__(11);
const data_source_1 = __importDefault(__webpack_require__(42));
const demo_seed_config_1 = __webpack_require__(66);
const demo_seed_constants_1 = __webpack_require__(67);
const demo_seed_helper_1 = __webpack_require__(68);
class DemoLargeSeeder {
    ds;
    report = (0, demo_seed_helper_1.createDemoSeedReport)();
    baseDate = new Date(Date.UTC(2026, 6, 1, 0, 0, 0, 0));
    usersByIndex = new Map();
    workspaceSpecs = this.buildWorkspaceSpecs();
    demoProOwnerIndexes = this.buildDemoProOwnerIndexes();
    passwordHash = null;
    constructor(ds) {
        this.ds = ds;
    }
    async run() {
        (0, demo_seed_helper_1.assertDemoSeedSafety)();
        faker_1.faker.seed(demo_seed_config_1.DEMO_SEED_CONFIG.fakerSeed);
        this.passwordHash = this.getDemoPasswordHash();
        await this.ds.initialize();
        try {
            await this.seedPrerequisites();
            await this.seedUsers();
            for (const spec of this.workspaceSpecs) {
                const committedReport = this.report;
                const workspaceReport = (0, demo_seed_helper_1.createDemoSeedReport)();
                try {
                    this.report = workspaceReport;
                    await this.ds.transaction(async (manager) => {
                        await this.seedWorkspace(spec, manager);
                    });
                    (0, demo_seed_helper_1.mergeDemoSeedReport)(committedReport, workspaceReport);
                }
                catch (error) {
                    (0, demo_seed_helper_1.addReport)(committedReport, 'workspaces', {
                        failed: 1,
                        reason: `workspace ${spec.slug} failed: ${this.formatError(error)}`,
                    });
                }
                finally {
                    this.report = committedReport;
                }
            }
            await this.validateSeededData();
            await this.analyzeSeededTables();
            (0, demo_seed_helper_1.printDemoSeedReport)(this.report);
            this.printDemoAccount();
        }
        finally {
            await this.ds.destroy();
        }
    }
    getDemoPasswordHash() {
        const password = process.env.DEMO_USER_PASSWORD?.trim();
        if (!password) {
            throw new Error('DEMO_USER_PASSWORD is required for demo users.');
        }
        return (0, utils_1.hashPassword)(password);
    }
    printDemoAccount() {
        console.log('');
        console.log(`Main demo account: ${this.userEmail(1)}`);
        console.log('Password: not printed. Use DEMO_USER_PASSWORD from env.');
    }
    formatError(error) {
        return error instanceof Error ? error.message : String(error);
    }
    buildWorkspaceSpecs() {
        const specs = [];
        for (let index = 1; index <= demo_seed_config_1.DEMO_SEED_CONFIG.workspaceCount; index += 1) {
            const tier = index <= demo_seed_config_1.DEMO_SEED_CONFIG.largeWorkspaceCount
                ? 'large'
                : index <=
                    demo_seed_config_1.DEMO_SEED_CONFIG.largeWorkspaceCount +
                        demo_seed_config_1.DEMO_SEED_CONFIG.mediumWorkspaceCount
                    ? 'medium'
                    : 'small';
            const memberCount = tier === 'large' ? 10 : tier === 'medium' ? 7 : 4;
            const projectCount = tier === 'large' ? 5 : tier === 'medium' ? 3 : index % 2 === 0 ? 2 : 1;
            const taskCount = tier === 'large' ? 70 : tier === 'medium' ? 40 : 9;
            const ownerUserIndex = index <= demo_seed_config_1.DEMO_SEED_CONFIG.mainDemoWorkspaceCount ? 1 : index + 10;
            const memberUserIndexes = this.buildMemberIndexes(index, ownerUserIndex, memberCount);
            specs.push({
                index,
                tier,
                slug: `${demo_seed_constants_1.DEMO_SEED_SLUG_PREFIX}-workspace-${(0, demo_seed_helper_1.padNumber)(index)}`,
                name: `${demo_seed_constants_1.DEMO_SEED_MARKER} ${faker_1.faker.company.name()} ${(0, demo_seed_helper_1.padNumber)(index)}`,
                ownerUserIndex,
                memberUserIndexes,
                projectCount,
                taskCount,
            });
        }
        return specs;
    }
    buildMemberIndexes(workspaceIndex, ownerUserIndex, memberCount) {
        const indexes = [ownerUserIndex];
        let cursor = workspaceIndex * 3;
        while (indexes.length < memberCount) {
            const candidate = ((cursor - 1) % demo_seed_config_1.DEMO_SEED_CONFIG.userCount) + 1;
            if (!indexes.includes(candidate)) {
                indexes.push(candidate);
            }
            cursor += 1;
        }
        return indexes;
    }
    buildDemoProOwnerIndexes() {
        const proOwnerIndexes = new Set();
        const proWorkspaceSpecs = this.workspaceSpecs.slice(0, demo_seed_config_1.DEMO_SEED_CONFIG.proWorkspaceCount);
        for (const spec of proWorkspaceSpecs) {
            proOwnerIndexes.add(spec.ownerUserIndex);
        }
        return proOwnerIndexes;
    }
    userEmail(index) {
        return `demo.v1.user.${(0, demo_seed_helper_1.padNumber)(index)}@${demo_seed_constants_1.DEMO_SEED_EMAIL_DOMAIN}`;
    }
    username(index) {
        return `demo_v1_user_${(0, demo_seed_helper_1.padNumber)(index)}`;
    }
    async seedPrerequisites() {
        await this.ds.transaction(async (manager) => {
            await this.seedPlans(manager);
            const sprintFeature = await this.seedSprintFeature(manager);
            await this.seedPlanFeatures(sprintFeature, manager);
            await this.seedPermissions(manager);
        });
    }
    async seedPlans(manager) {
        const repo = manager.getRepository(plan_entity_1.Plan);
        const planItems = [
            {
                name: 'FREE',
                slug: default_plan_limits_constant_1.FREE_PLAN_SLUG,
                description: 'Basic plan for getting started.',
                priceAmount: 0,
                currency: 'VND',
                billingInterval: plan_entity_1.PlanBillingInterval.MONTH,
                features: {
                    kanban: true,
                    [feature_key_constant_1.FeatureKey.SPRINT_ENABLED]: true,
                    storage: true,
                    pageTemplates: true,
                },
                limits: default_plan_limits_constant_1.DEFAULT_PLAN_LIMITS[default_plan_limits_constant_1.FREE_PLAN_SLUG],
                isActive: true,
                sortOrder: 1,
            },
            {
                name: 'PRO',
                slug: default_plan_limits_constant_1.PRO_PLAN_SLUG,
                description: 'Monthly pro plan for growing workspaces.',
                priceAmount: 99000,
                currency: 'VND',
                billingInterval: plan_entity_1.PlanBillingInterval.MONTH,
                features: {
                    kanban: true,
                    [feature_key_constant_1.FeatureKey.SPRINT_ENABLED]: true,
                    storage: true,
                    pageTemplates: true,
                    upgradedWorkspaces: true,
                },
                limits: default_plan_limits_constant_1.DEFAULT_PLAN_LIMITS[default_plan_limits_constant_1.PRO_PLAN_SLUG],
                isActive: true,
                sortOrder: 2,
            },
        ];
        const existing = await repo.find({
            where: { slug: (0, typeorm_1.In)(planItems.map((item) => item.slug)) },
            withDeleted: true,
        });
        const existingBySlug = new Map(existing.map((item) => [item.slug, item]));
        const toCreate = [];
        for (const item of planItems) {
            const existed = existingBySlug.get(item.slug);
            if (existed) {
                (0, demo_seed_helper_1.addReport)(this.report, 'plans', { existing: 1 });
                continue;
            }
            toCreate.push(repo.create(item));
        }
        await this.saveCreated(repo, toCreate, 'plans');
    }
    async seedSprintFeature(manager) {
        const repo = manager.getRepository(feature_entity_1.Feature);
        const code = feature_key_constant_1.FeatureKey.SPRINT_ENABLED.toLowerCase();
        let feature = await repo
            .createQueryBuilder('feature')
            .withDeleted()
            .where('LOWER(feature.code) = :code', { code })
            .orWhere('LOWER(feature.code) = :legacyCode', { legacyCode: 'sprint' })
            .getOne();
        if (feature) {
            (0, demo_seed_helper_1.addReport)(this.report, 'features', { existing: 1 });
            if (feature.deletedAt) {
                feature.deletedAt = null;
                feature.isActive = true;
                await repo.save(feature);
            }
            return feature;
        }
        feature = await repo.save(repo.create({
            code,
            name: 'Sprint',
            description: 'Enable sprint planning and backlog workflows.',
            category: 'agile',
            isActive: true,
            metadata: { seedKey: demo_seed_constants_1.DEMO_SEED_KEY },
        }));
        (0, demo_seed_helper_1.addReport)(this.report, 'features', { created: 1 });
        return feature;
    }
    async seedPlanFeatures(sprintFeature, manager) {
        const planRepo = manager.getRepository(plan_entity_1.Plan);
        const repo = manager.getRepository(plan_feature_entity_1.PlanFeature);
        const plans = await planRepo.find({
            where: { slug: (0, typeorm_1.In)([default_plan_limits_constant_1.FREE_PLAN_SLUG, default_plan_limits_constant_1.PRO_PLAN_SLUG]) },
        });
        const existing = await repo.find({
            where: {
                planId: (0, typeorm_1.In)(plans.map((plan) => plan.id)),
                featureId: sprintFeature.id,
            },
            withDeleted: true,
        });
        const existingKeys = new Set(existing.map((item) => `${item.planId}:${item.featureId}`));
        const toCreate = [];
        for (const plan of plans) {
            const key = `${plan.id}:${sprintFeature.id}`;
            if (existingKeys.has(key)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'planFeatures', { existing: 1 });
                continue;
            }
            toCreate.push(repo.create({
                planId: plan.id,
                featureId: sprintFeature.id,
                enabled: plan.features?.[sprintFeature.code] === true,
                metadata: { seedKey: demo_seed_constants_1.DEMO_SEED_KEY },
            }));
        }
        await this.saveCreated(repo, toCreate, 'planFeatures');
    }
    async seedPermissions(manager) {
        const repo = manager.getRepository(permission_entity_1.Permission);
        const codes = permission_constant_1.PERMISSION_SEED_DATA.map((item) => item.code);
        const existing = await repo.find({ where: { code: (0, typeorm_1.In)(codes) } });
        const existingCodes = new Set(existing.map((item) => item.code));
        const toCreate = permission_constant_1.PERMISSION_SEED_DATA.filter((item) => !existingCodes.has(item.code)).map((item) => repo.create({
            code: item.code,
            description: item.description,
        }));
        (0, demo_seed_helper_1.addReport)(this.report, 'permissions', {
            existing: existing.length,
        });
        await this.saveCreated(repo, toCreate, 'permissions');
    }
    async seedUsers() {
        await this.ds.transaction(async (manager) => {
            const userRepo = manager.getRepository(user_entity_1.User);
            const profileRepo = manager.getRepository(user_profile_entity_1.UserProfile);
            const emails = Array.from({ length: demo_seed_config_1.DEMO_SEED_CONFIG.userCount }, (_, index) => this.userEmail(index + 1));
            const usernames = Array.from({ length: demo_seed_config_1.DEMO_SEED_CONFIG.userCount }, (_, index) => this.username(index + 1));
            const existingUsers = await userRepo.find({
                where: [{ email: (0, typeorm_1.In)(emails) }, { username: (0, typeorm_1.In)(usernames) }],
            });
            const byEmail = new Map(existingUsers.map((user) => [user.email, user]));
            const byUsername = new Map(existingUsers.map((user) => [user.username, user]));
            const toCreate = [];
            for (let index = 1; index <= demo_seed_config_1.DEMO_SEED_CONFIG.userCount; index += 1) {
                const email = this.userEmail(index);
                const username = this.username(index);
                const existingByEmail = byEmail.get(email);
                const existingByUsername = byUsername.get(username);
                if (existingByEmail) {
                    this.usersByIndex.set(index, existingByEmail);
                    (0, demo_seed_helper_1.addReport)(this.report, 'users', { existing: 1 });
                    continue;
                }
                if (existingByUsername) {
                    (0, demo_seed_helper_1.addReport)(this.report, 'users', {
                        skipped: 1,
                        reason: `username conflict for ${username}`,
                    });
                    continue;
                }
                toCreate.push(userRepo.create({
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
                    systemRole: index === 1 ? user_entity_1.SystemRole.SYSTEM_ADMIN : user_entity_1.SystemRole.USER,
                }));
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
    async seedUserProfiles(profileRepo) {
        const users = [...this.usersByIndex.entries()];
        const existingProfiles = await profileRepo.find({
            where: { userId: (0, typeorm_1.In)(users.map(([, user]) => user.id)) },
        });
        const existingUserIds = new Set(existingProfiles.map((profile) => profile.userId));
        const toCreate = [];
        for (const [index, user] of users) {
            if (existingUserIds.has(user.id)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'userProfiles', { existing: 1 });
                continue;
            }
            const fullName = faker_1.faker.person.fullName();
            toCreate.push(profileRepo.create({
                userId: user.id,
                displayName: fullName,
                fullName,
                bio: `${demo_seed_constants_1.DEMO_SEED_MARKER} Demo user for task management workflows.`,
                phoneNumber: null,
                location: index % 2 === 0 ? 'Ho Chi Minh City' : 'Ha Noi',
                jobTitle: this.pick([
                    'Product Manager',
                    'Backend Engineer',
                    'Frontend Engineer',
                    'QA Engineer',
                    'UX Designer',
                    'Scrum Master',
                ], index),
                website: null,
                coverUrl: null,
                timezone: 'Asia/Bangkok',
                language: 'vi',
            }));
        }
        await this.saveCreated(profileRepo, toCreate, 'userProfiles');
    }
    async seedWorkspace(spec, manager) {
        const workspace = await this.seedOneWorkspace(spec, manager);
        const billingPlan = await this.syncWorkspaceBillingState(spec, workspace, manager);
        const rolesByName = await this.seedRolesAndRolePermissions(workspace, manager);
        const members = await this.seedWorkspaceMembers(spec, workspace, rolesByName, manager);
        await this.seedWorkspaceFeatureSetting(workspace, spec, manager);
        const state = {
            spec,
            workspace,
            members,
            rolesByName,
            projects: [],
        };
        const projectSpecs = this.buildProjectSpecs(spec);
        for (const projectSpec of projectSpecs) {
            const projectState = await this.seedProjectGraph(state, projectSpec, manager);
            state.projects.push(projectState);
        }
        await this.seedUsageLimits(state, billingPlan, manager);
    }
    async seedOneWorkspace(spec, manager) {
        const repo = manager.getRepository(workspace_entity_1.Workspace);
        const owner = this.usersByIndex.get(spec.ownerUserIndex);
        if (!owner) {
            throw new Error(`Owner user ${spec.ownerUserIndex} missing`);
        }
        let workspace = await repo.findOne({
            where: { slug: spec.slug },
            withDeleted: true,
        });
        if (workspace) {
            (0, demo_seed_helper_1.addReport)(this.report, 'workspaces', { existing: 1 });
            if (workspace.deletedAt) {
                workspace.deletedAt = null;
                workspace.deletedBy = null;
                await repo.save(workspace);
            }
            return workspace;
        }
        workspace = await repo.save(repo.create({
            name: spec.name,
            slug: spec.slug,
            planType: workspace_entity_1.PlanTypeWorkspace.FREE,
            layoutMode: workspace_entity_1.WorkspaceLayoutMode.TABS,
            createdBy: owner.id,
            deletedAt: null,
            deletedBy: null,
        }));
        (0, demo_seed_helper_1.addReport)(this.report, 'workspaces', { created: 1 });
        return workspace;
    }
    async syncWorkspaceBillingState(spec, workspace, manager) {
        const planRepo = manager.getRepository(plan_entity_1.Plan);
        const plans = await planRepo.find({
            where: {
                slug: (0, typeorm_1.In)([default_plan_limits_constant_1.FREE_PLAN_SLUG, default_plan_limits_constant_1.PRO_PLAN_SLUG]),
                isActive: true,
            },
        });
        const planBySlug = new Map(plans.map((plan) => [plan.slug, plan]));
        const freePlan = planBySlug.get(default_plan_limits_constant_1.FREE_PLAN_SLUG);
        const proPlan = planBySlug.get(default_plan_limits_constant_1.PRO_PLAN_SLUG);
        const isProWorkspace = proPlan
            ? this.isDemoProWorkspace(spec, proPlan)
            : false;
        const plan = isProWorkspace ? proPlan : freePlan;
        if (!plan) {
            const planSlug = isProWorkspace ? default_plan_limits_constant_1.PRO_PLAN_SLUG : default_plan_limits_constant_1.FREE_PLAN_SLUG;
            throw new Error(`Plan ${planSlug} is missing`);
        }
        const expectedPlanType = isProWorkspace
            ? workspace_entity_1.PlanTypeWorkspace.PRO
            : workspace_entity_1.PlanTypeWorkspace.FREE;
        if (workspace.planType !== expectedPlanType) {
            workspace.planType = expectedPlanType;
            await manager.getRepository(workspace_entity_1.Workspace).save(workspace);
        }
        if (isProWorkspace) {
            await this.seedDemoSubscriptionWorkspace(spec, workspace, plan, manager);
        }
        else {
            await this.detachDemoSubscriptionWorkspace(workspace, manager);
        }
        return plan;
    }
    isDemoProWorkspace(spec, plan) {
        if (!this.demoProOwnerIndexes.has(spec.ownerUserIndex)) {
            return false;
        }
        const limits = (0, plan_limit_util_1.mergePlanLimits)(plan);
        const upgradedWorkspaces = (0, plan_limit_util_1.getNumberLimit)(limits, 'upgradedWorkspaces', 1);
        if (upgradedWorkspaces <= 0) {
            return false;
        }
        const selectedWorkspaceRank = this.workspaceSpecs
            .filter((item) => item.ownerUserIndex === spec.ownerUserIndex &&
            item.index <= demo_seed_config_1.DEMO_SEED_CONFIG.proWorkspaceCount)
            .findIndex((item) => item.index === spec.index);
        return (selectedWorkspaceRank >= 0 &&
            selectedWorkspaceRank + 1 <= upgradedWorkspaces);
    }
    async seedDemoSubscriptionWorkspace(spec, workspace, plan, manager) {
        const owner = this.usersByIndex.get(spec.ownerUserIndex);
        if (!owner) {
            throw new Error(`Owner user ${spec.ownerUserIndex} missing`);
        }
        const subscriptionRepo = manager.getRepository(subscription_entity_1.Subscription);
        const subscriptionWorkspaceRepo = manager.getRepository(subscription_workspace_entity_1.SubscriptionWorkspace);
        const subscriptionSeedId = (0, demo_seed_helper_1.demoSeedId)('subscription-owner', owner.id);
        const currentPeriodStart = this.baseDate;
        const currentPeriodEnd = new Date(Date.UTC(2099, 11, 31, 23, 59, 59, 0));
        let subscription = await subscriptionRepo
            .createQueryBuilder('subscription')
            .where("subscription.metadata ->> 'seedKey' = :seedKey", {
            seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
        })
            .andWhere("subscription.metadata ->> 'seedId' = :seedId", {
            seedId: subscriptionSeedId,
        })
            .getOne();
        if (subscription) {
            subscription.userId = owner.id;
            subscription.planId = plan.id;
            subscription.provider = subscription_entity_1.BillingProvider.MANUAL;
            subscription.status = subscription_entity_1.SubscriptionStatus.ACTIVE;
            subscription.currentPeriodStart = currentPeriodStart;
            subscription.currentPeriodEnd = currentPeriodEnd;
            subscription.trialEnd = null;
            subscription.cancelAtPeriodEnd = false;
            subscription.cancelledAt = null;
            subscription.metadata = {
                ...(subscription.metadata ?? {}),
                seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
                seedId: subscriptionSeedId,
                planSlug: plan.slug,
                workspaceIds: this.mergeWorkspaceIds(subscription.metadata?.workspaceIds, workspace.id),
            };
            await subscriptionRepo.save(subscription);
            (0, demo_seed_helper_1.addReport)(this.report, 'subscriptions', { existing: 1 });
        }
        else {
            subscription = await subscriptionRepo.save(subscriptionRepo.create({
                userId: owner.id,
                planId: plan.id,
                provider: subscription_entity_1.BillingProvider.MANUAL,
                providerSubscriptionId: null,
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                currentPeriodStart,
                currentPeriodEnd,
                trialEnd: null,
                cancelAtPeriodEnd: false,
                cancelledAt: null,
                metadata: {
                    seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
                    seedId: subscriptionSeedId,
                    planSlug: plan.slug,
                    workspaceIds: [workspace.id],
                },
            }));
            (0, demo_seed_helper_1.addReport)(this.report, 'subscriptions', { created: 1 });
        }
        const existingSubscriptionWorkspace = await subscriptionWorkspaceRepo.findOne({
            where: {
                workspaceId: workspace.id,
            },
        });
        if (existingSubscriptionWorkspace) {
            if (existingSubscriptionWorkspace.subscriptionId === subscription.id) {
                (0, demo_seed_helper_1.addReport)(this.report, 'subscriptionWorkspaces', { existing: 1 });
                return;
            }
            const linkedSubscription = await subscriptionRepo.findOne({
                where: {
                    id: existingSubscriptionWorkspace.subscriptionId,
                },
            });
            if (linkedSubscription?.metadata?.seedKey !== demo_seed_constants_1.DEMO_SEED_KEY) {
                (0, demo_seed_helper_1.addReport)(this.report, 'subscriptionWorkspaces', {
                    skipped: 1,
                    reason: `workspace ${workspace.slug} already has a non-demo subscription`,
                });
                return;
            }
            existingSubscriptionWorkspace.subscriptionId = subscription.id;
            existingSubscriptionWorkspace.activatedAt = currentPeriodStart;
            await subscriptionWorkspaceRepo.save(existingSubscriptionWorkspace);
            (0, demo_seed_helper_1.addReport)(this.report, 'subscriptionWorkspaces', { existing: 1 });
            return;
        }
        await subscriptionWorkspaceRepo.save(subscriptionWorkspaceRepo.create({
            subscriptionId: subscription.id,
            workspaceId: workspace.id,
            activatedAt: currentPeriodStart,
        }));
        (0, demo_seed_helper_1.addReport)(this.report, 'subscriptionWorkspaces', { created: 1 });
    }
    async detachDemoSubscriptionWorkspace(workspace, manager) {
        const subscriptionRepo = manager.getRepository(subscription_entity_1.Subscription);
        const subscriptionWorkspaceRepo = manager.getRepository(subscription_workspace_entity_1.SubscriptionWorkspace);
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
        if (subscription?.metadata?.seedKey !== demo_seed_constants_1.DEMO_SEED_KEY) {
            return;
        }
        await subscriptionWorkspaceRepo.remove(subscriptionWorkspace);
    }
    mergeWorkspaceIds(value, workspaceId) {
        const workspaceIds = new Set();
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
    async seedRolesAndRolePermissions(workspace, manager) {
        const roleRepo = manager.getRepository(role_entity_1.Role);
        const rolePermissionRepo = manager.getRepository(role_permission_entity_1.RolePermission);
        const permissionRepo = manager.getRepository(permission_entity_1.Permission);
        const existingRoles = await roleRepo.find({
            where: { workspace_id: workspace.id },
        });
        const rolesByName = new Map(existingRoles.map((role) => [role.name, role]));
        const rolesToCreate = Object.values(role_entity_1.RoleName)
            .filter((roleName) => !rolesByName.has(roleName))
            .map((roleName) => roleRepo.create({
            workspace_id: workspace.id,
            name: roleName,
        }));
        const createdRoles = await this.saveCreated(roleRepo, rolesToCreate, 'roles');
        (0, demo_seed_helper_1.addReport)(this.report, 'roles', {
            existing: existingRoles.length,
        });
        for (const role of createdRoles) {
            rolesByName.set(role.name, role);
        }
        const permissions = await permissionRepo.find();
        const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));
        const existingRolePermissions = await rolePermissionRepo.find({
            where: { role_id: (0, typeorm_1.In)([...rolesByName.values()].map((role) => role.id)) },
        });
        const existingKeys = new Set(existingRolePermissions.map((item) => `${item.role_id}:${item.permission_id}`));
        const rolePermissionsToCreate = [];
        for (const [roleName, permissionCodes] of Object.entries(role_permission_map_constant_1.ROLE_PERMISSION_MAP)) {
            const role = rolesByName.get(roleName);
            if (!role)
                continue;
            for (const permissionCode of permissionCodes) {
                const permission = permissionByCode.get(permissionCode);
                if (!permission) {
                    (0, demo_seed_helper_1.addReport)(this.report, 'rolePermissions', {
                        skipped: 1,
                        reason: `missing permission ${permissionCode}`,
                    });
                    continue;
                }
                const key = `${role.id}:${permission.id}`;
                if (existingKeys.has(key)) {
                    (0, demo_seed_helper_1.addReport)(this.report, 'rolePermissions', { existing: 1 });
                    continue;
                }
                rolePermissionsToCreate.push(rolePermissionRepo.create({
                    role_id: role.id,
                    permission_id: permission.id,
                }));
            }
        }
        await this.saveCreated(rolePermissionRepo, rolePermissionsToCreate, 'rolePermissions');
        return rolesByName;
    }
    async seedWorkspaceMembers(spec, workspace, rolesByName, manager) {
        const userWorkspaceRepo = manager.getRepository(user_workspace_entity_1.UserWorkspace);
        const userRoleRepo = manager.getRepository(user_role_entity_1.UserRole);
        const members = spec.memberUserIndexes
            .map((index) => this.usersByIndex.get(index))
            .filter((user) => Boolean(user));
        const existingMemberships = await userWorkspaceRepo.find({
            where: {
                workspace_id: workspace.id,
                user_id: (0, typeorm_1.In)(members.map((user) => user.id)),
            },
        });
        const existingMembershipKeys = new Set(existingMemberships.map((item) => `${item.workspace_id}:${item.user_id}`));
        const membershipsToCreate = [];
        for (const user of members) {
            const key = `${workspace.id}:${user.id}`;
            if (existingMembershipKeys.has(key)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'workspaceMembers', { existing: 1 });
                continue;
            }
            membershipsToCreate.push(userWorkspaceRepo.create({
                workspace_id: workspace.id,
                user_id: user.id,
                lastOpenedAt: null,
            }));
        }
        await this.saveCreated(userWorkspaceRepo, membershipsToCreate, 'workspaceMembers');
        const roleAssignments = this.buildRoleAssignments(spec, members);
        const existingUserRoles = await userRoleRepo.find({
            where: {
                workspace_id: workspace.id,
                user_id: (0, typeorm_1.In)(members.map((user) => user.id)),
            },
        });
        const existingUserRoleKeys = new Set(existingUserRoles.map((item) => `${item.user_id}:${item.workspace_id}:${item.role_id}`));
        const userRolesToCreate = [];
        for (const assignment of roleAssignments) {
            const user = this.usersByIndex.get(assignment.userIndex);
            const role = rolesByName.get(assignment.roleName);
            if (!user || !role)
                continue;
            const key = `${user.id}:${workspace.id}:${role.id}`;
            if (existingUserRoleKeys.has(key)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'userRoles', { existing: 1 });
                continue;
            }
            userRolesToCreate.push(userRoleRepo.create({
                user_id: user.id,
                workspace_id: workspace.id,
                role_id: role.id,
                assigned_by: this.usersByIndex.get(spec.ownerUserIndex)?.id ?? null,
            }));
        }
        await this.saveCreated(userRoleRepo, userRolesToCreate, 'userRoles');
        return members;
    }
    buildRoleAssignments(spec, members) {
        return members.map((user, memberOffset) => {
            const match = /demo_v1_user_(\d{3})/.exec(user.username);
            const userIndex = match ? Number(match[1]) : spec.ownerUserIndex;
            if (userIndex === spec.ownerUserIndex) {
                return { userIndex, roleName: role_entity_1.RoleName.OWNER };
            }
            if (memberOffset === 1) {
                return { userIndex, roleName: role_entity_1.RoleName.ADMIN };
            }
            if (memberOffset === members.length - 1 && spec.tier !== 'small') {
                return { userIndex, roleName: role_entity_1.RoleName.VIEWER };
            }
            return { userIndex, roleName: role_entity_1.RoleName.MEMBER };
        });
    }
    async seedWorkspaceFeatureSetting(workspace, spec, manager) {
        const featureRepo = manager.getRepository(feature_entity_1.Feature);
        const repo = manager.getRepository(workspace_feature_setting_entity_1.WorkspaceFeatureSetting);
        const feature = await featureRepo
            .createQueryBuilder('feature')
            .where('LOWER(feature.code) = :code', {
            code: feature_key_constant_1.FeatureKey.SPRINT_ENABLED.toLowerCase(),
        })
            .getOne();
        if (!feature) {
            (0, demo_seed_helper_1.addReport)(this.report, 'workspaceFeatureSettings', {
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
            (0, demo_seed_helper_1.addReport)(this.report, 'workspaceFeatureSettings', { existing: 1 });
            if (existed.deletedAt) {
                existed.deletedAt = null;
                existed.enabled = true;
                existed.updatedBy =
                    this.usersByIndex.get(spec.ownerUserIndex)?.id ?? null;
                await repo.save(existed);
            }
            return;
        }
        await repo.save(repo.create({
            workspaceId: workspace.id,
            featureId: feature.id,
            enabled: true,
            createdBy: this.usersByIndex.get(spec.ownerUserIndex)?.id ?? null,
            updatedBy: null,
            metadata: { seedKey: demo_seed_constants_1.DEMO_SEED_KEY },
        }));
        (0, demo_seed_helper_1.addReport)(this.report, 'workspaceFeatureSettings', { created: 1 });
    }
    buildProjectSpecs(spec) {
        const counts = this.distribute(spec.taskCount, spec.projectCount);
        return Array.from({ length: spec.projectCount }, (_, index) => {
            const projectIndex = index + 1;
            return {
                workspaceIndex: spec.index,
                projectIndex,
                key: `DV1W${(0, demo_seed_helper_1.padNumber)(spec.index, 2)}P${(0, demo_seed_helper_1.padNumber)(projectIndex, 2)}`,
                name: `${demo_seed_constants_1.DEMO_SEED_MARKER} ${this.pick(['Platform', 'Mobile', 'Billing', 'Analytics', 'Operations'], spec.index + projectIndex)} ${(0, demo_seed_helper_1.padNumber)(spec.index, 2)}-${(0, demo_seed_helper_1.padNumber)(projectIndex, 2)}`,
                taskCount: counts[index],
                sprintCount: spec.tier === 'small'
                    ? projectIndex === 1
                        ? 1
                        : 0
                    : projectIndex === 1
                        ? 3
                        : 2,
            };
        });
    }
    async seedProjectGraph(state, projectSpec, manager) {
        const project = await this.seedProject(state, projectSpec, manager);
        const board = await this.seedBoard(state, project, manager);
        const statuses = await this.seedTaskStatuses(state.workspace, project, manager);
        const priorities = await this.seedTaskPriorities(state.workspace, project, manager);
        const sprints = await this.seedSprints(state, project, projectSpec, manager);
        const tasks = await this.seedTasks(state, project, projectSpec, statuses, priorities, sprints, manager);
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
    async seedProject(state, spec, manager) {
        const repo = manager.getRepository(project_entity_1.Project);
        let project = await repo.findOne({
            where: { workspace_id: state.workspace.id, key: spec.key },
            withDeleted: true,
        });
        if (project) {
            (0, demo_seed_helper_1.addReport)(this.report, 'projects', { existing: 1 });
            if (project.deleted_at) {
                project.deleted_at = null;
                project.deleted_by = null;
                await repo.save(project);
            }
            return project;
        }
        project = await repo.save(repo.create({
            workspace_id: state.workspace.id,
            name: spec.name,
            key: spec.key,
            visibility: project_entity_1.ProjectVisibility.INTERNAL,
            task_seq: 0,
            created_by: this.usersByIndex.get(state.spec.ownerUserIndex).id,
            deleted_at: null,
            deleted_by: null,
        }));
        (0, demo_seed_helper_1.addReport)(this.report, 'projects', { created: 1 });
        return project;
    }
    async seedBoard(state, project, manager) {
        const repo = manager.getRepository(board_entity_1.Board);
        const name = `${demo_seed_constants_1.DEMO_SEED_MARKER} Board`;
        let board = await repo.findOne({
            where: { projectId: project.id, name },
            withDeleted: true,
        });
        if (board) {
            (0, demo_seed_helper_1.addReport)(this.report, 'boards', { existing: 1 });
            if (board.deletedAt) {
                board.deletedAt = null;
                board.deletedBy = null;
                await repo.save(board);
            }
            return board;
        }
        board = await repo.save(repo.create({
            workspaceId: state.workspace.id,
            projectId: project.id,
            name,
            viewType: board_entity_1.BoardViewType.BOARD,
            createdBy: this.usersByIndex.get(state.spec.ownerUserIndex).id,
            updatedBy: null,
            deletedAt: null,
            deletedBy: null,
        }));
        (0, demo_seed_helper_1.addReport)(this.report, 'boards', { created: 1 });
        return board;
    }
    async seedTaskStatuses(workspace, project, manager) {
        const repo = manager.getRepository(task_status_entity_1.TaskStatus);
        const names = default_task_status_constant_1.DEFAULT_TASK_STATUSES.map((item) => item.name);
        const existing = await repo.find({
            where: {
                projectId: project.id,
                name: (0, typeorm_1.In)(names),
            },
        });
        const byName = new Map(existing.map((item) => [item.name, item]));
        const toCreate = default_task_status_constant_1.DEFAULT_TASK_STATUSES.filter((item) => !byName.has(item.name)).map((item) => repo.create({
            workspaceId: workspace.id,
            projectId: project.id,
            ...item,
        }));
        const created = await this.saveCreated(repo, toCreate, 'taskStatuses');
        (0, demo_seed_helper_1.addReport)(this.report, 'taskStatuses', { existing: existing.length });
        return [...existing, ...created].sort((a, b) => a.position - b.position);
    }
    async seedTaskPriorities(workspace, project, manager) {
        const repo = manager.getRepository(task_priority_entity_1.TaskPriority);
        const names = default_task_priority_constant_1.DEFAULT_TASK_PRIORITIES.map((item) => item.name);
        const existing = await repo.find({
            where: {
                projectId: project.id,
                name: (0, typeorm_1.In)(names),
            },
        });
        const byName = new Map(existing.map((item) => [item.name, item]));
        const toCreate = default_task_priority_constant_1.DEFAULT_TASK_PRIORITIES.filter((item) => !byName.has(item.name)).map((item) => repo.create({
            workspaceId: workspace.id,
            projectId: project.id,
            ...item,
        }));
        const created = await this.saveCreated(repo, toCreate, 'taskPriorities');
        (0, demo_seed_helper_1.addReport)(this.report, 'taskPriorities', { existing: existing.length });
        return [...existing, ...created].sort((a, b) => a.level - b.level);
    }
    async seedSprints(state, project, projectSpec, manager) {
        if (projectSpec.sprintCount === 0)
            return [];
        const repo = manager.getRepository(sprint_entity_1.Sprint);
        const specs = this.buildSprintSpecs(projectSpec);
        const existing = await repo.find({
            where: {
                projectId: project.id,
                name: (0, typeorm_1.In)(specs.map((item) => item.name)),
            },
            withDeleted: true,
        });
        const byName = new Map(existing.map((item) => [item.name, item]));
        const toCreate = [];
        const restored = [];
        for (const spec of specs) {
            const existed = byName.get(spec.name);
            if (existed) {
                (0, demo_seed_helper_1.addReport)(this.report, 'sprints', { existing: 1 });
                if (existed.deletedAt) {
                    existed.deletedAt = null;
                    existed.deletedBy = null;
                    restored.push(existed);
                }
                continue;
            }
            toCreate.push(repo.create({
                workspaceId: state.workspace.id,
                projectId: project.id,
                name: spec.name,
                goal: spec.goal,
                status: spec.status,
                startAt: spec.startAt,
                endAt: spec.endAt,
                completedAt: spec.completedAt,
                createdBy: this.usersByIndex.get(state.spec.ownerUserIndex).id,
                deletedAt: null,
                deletedBy: null,
            }));
        }
        if (restored.length) {
            await repo.save(restored);
        }
        const created = await this.saveCreated(repo, toCreate, 'sprints');
        return [...existing, ...created].sort((a, b) => a.name.localeCompare(b.name));
    }
    buildSprintSpecs(projectSpec) {
        const statuses = projectSpec.sprintCount >= 3
            ? [sprint_entity_1.SprintStatus.COMPLETED, sprint_entity_1.SprintStatus.ACTIVE, sprint_entity_1.SprintStatus.PLANNED]
            : projectSpec.sprintCount === 2
                ? [sprint_entity_1.SprintStatus.ACTIVE, sprint_entity_1.SprintStatus.PLANNED]
                : [sprint_entity_1.SprintStatus.PLANNED];
        return statuses.map((status, index) => {
            const sprintIndex = index + 1;
            const startAt = (0, demo_seed_helper_1.addDays)(this.baseDate, index * 14 - 30);
            const endAt = (0, demo_seed_helper_1.addDays)(startAt, 13);
            return {
                workspaceIndex: projectSpec.workspaceIndex,
                projectIndex: projectSpec.projectIndex,
                sprintIndex,
                name: `${demo_seed_constants_1.DEMO_SEED_MARKER}[W${(0, demo_seed_helper_1.padNumber)(projectSpec.workspaceIndex, 2)}][P${(0, demo_seed_helper_1.padNumber)(projectSpec.projectIndex, 2)}] Sprint ${(0, demo_seed_helper_1.padNumber)(sprintIndex, 2)}`,
                goal: `${demo_seed_constants_1.DEMO_SEED_MARKER} ${faker_1.faker.company.catchPhrase()}`,
                status,
                startAt,
                endAt,
                completedAt: status === sprint_entity_1.SprintStatus.COMPLETED ? endAt : null,
            };
        });
    }
    async seedTasks(state, project, projectSpec, statuses, priorities, sprints, manager) {
        const repo = manager.getRepository(task_entity_1.Task);
        const specs = this.buildTaskSpecs(state, projectSpec, sprints);
        const existing = await repo.find({
            where: {
                projectId: project.id,
                projectSeq: (0, typeorm_1.In)(specs.map((item) => item.projectSeq)),
            },
            withDeleted: true,
        });
        const bySeq = new Map(existing
            .filter((item) => item.projectSeq !== null)
            .map((item) => [item.projectSeq, item]));
        const tasksToCreate = [];
        const restored = [];
        const reusable = [];
        for (const spec of specs) {
            const existed = bySeq.get(spec.projectSeq);
            const status = statuses[spec.statusIndex % statuses.length];
            const priority = priorities[spec.priorityIndex % priorities.length];
            const sprint = spec.sprintIndex ? sprints[spec.sprintIndex - 1] : null;
            const reporter = this.usersByIndex.get(spec.reporterUserIndex);
            if (!reporter) {
                (0, demo_seed_helper_1.addReport)(this.report, 'tasks', {
                    skipped: 1,
                    reason: `reporter user ${spec.reporterUserIndex} missing`,
                });
                continue;
            }
            if (existed) {
                if (!existed.title?.includes(demo_seed_constants_1.DEMO_SEED_MARKER)) {
                    (0, demo_seed_helper_1.addReport)(this.report, 'tasks', {
                        skipped: 1,
                        reason: `non-demo task already uses ${project.key}-${spec.projectSeq}`,
                    });
                    continue;
                }
                (0, demo_seed_helper_1.addReport)(this.report, 'tasks', { existing: 1 });
                if (existed.deletedAt) {
                    existed.deletedAt = null;
                    existed.deletedBy = null;
                    restored.push(existed);
                }
                reusable.push(existed);
                continue;
            }
            tasksToCreate.push(repo.create({
                workspaceId: state.workspace.id,
                projectId: project.id,
                parentTaskId: null,
                sprintId: sprint?.id ?? null,
                projectSeq: spec.projectSeq,
                title: spec.title,
                description: spec.description,
                statusId: sprint?.status === sprint_entity_1.SprintStatus.COMPLETED
                    ? statuses[2].id
                    : status.id,
                priorityId: priority.id,
                createdBy: reporter.id,
                startAt: spec.startAt,
                dueAt: spec.dueAt,
                completedAt: sprint?.status === sprint_entity_1.SprintStatus.COMPLETED || status.isDone
                    ? (spec.completedAt ?? spec.dueAt)
                    : null,
                estimateMinutes: spec.estimateMinutes,
                deletedAt: null,
                deletedBy: null,
            }));
        }
        if (restored.length) {
            await repo.save(restored);
        }
        const created = await this.saveCreated(repo, tasksToCreate, 'tasks');
        const allTasks = [...reusable, ...created];
        const maxSeq = Math.max(0, ...allTasks.map((task) => task.projectSeq ?? 0));
        if (maxSeq > 0) {
            await manager
                .getRepository(project_entity_1.Project)
                .createQueryBuilder()
                .update(project_entity_1.Project)
                .set({ task_seq: () => `GREATEST(task_seq, ${maxSeq})` })
                .where('id = :projectId', { projectId: project.id })
                .execute();
        }
        return allTasks.sort((a, b) => (a.projectSeq ?? 0) - (b.projectSeq ?? 0));
    }
    buildTaskSpecs(state, projectSpec, sprints) {
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
            const sprintIndex = sprints.length > 0 && taskIndex % 4 !== 0
                ? ((taskIndex - 1) % sprints.length) + 1
                : null;
            const statusIndex = taskIndex % default_task_status_constant_1.DEFAULT_TASK_STATUSES.length;
            const marker = (0, demo_seed_helper_1.demoMarker)(`W${(0, demo_seed_helper_1.padNumber)(projectSpec.workspaceIndex, 2)}`, `P${(0, demo_seed_helper_1.padNumber)(projectSpec.projectIndex, 2)}`, `T${(0, demo_seed_helper_1.padNumber)(taskIndex)}`);
            return {
                workspaceIndex: projectSpec.workspaceIndex,
                projectIndex: projectSpec.projectIndex,
                taskIndex,
                projectSeq: taskIndex,
                title: `${marker} ${this.pick(verbs, taskIndex)} ${this.pick(domains, taskIndex + projectSpec.projectIndex)}`,
                description: `${marker} ${faker_1.faker.lorem.paragraph()}`,
                statusIndex,
                priorityIndex: taskIndex % default_task_priority_constant_1.DEFAULT_TASK_PRIORITIES.length,
                sprintIndex,
                reporterUserIndex: this.pick(memberIndexes, taskIndex),
                assigneeUserIndex: taskIndex % 6 === 0 ? null : this.pick(memberIndexes, taskIndex + 2),
                startAt: (0, demo_seed_helper_1.addDays)(this.baseDate, (taskIndex % 45) - 20),
                dueAt: (0, demo_seed_helper_1.addDays)(this.baseDate, (taskIndex % 60) - 15),
                completedAt: (0, demo_seed_helper_1.addDays)(this.baseDate, (taskIndex % 60) - 10),
                estimateMinutes: this.pick([30, 60, 90, 120, 180, 240, 360], taskIndex),
            };
        });
    }
    async seedTaskAssignees(state, tasks, manager) {
        if (!tasks.length)
            return;
        const repo = manager.getRepository(task_assignee_entity_1.TaskAssignee);
        const existing = await repo.find({
            where: { taskId: (0, typeorm_1.In)(tasks.map((task) => task.id)) },
        });
        const existingKeys = new Set(existing.map((item) => `${item.taskId}:${item.userId}`));
        const memberIds = new Set(state.members.map((user) => user.id));
        const toCreate = [];
        for (const task of tasks) {
            const assigneeIndex = (task.projectSeq ?? 1) % 6 === 0
                ? null
                : this.pick(state.spec.memberUserIndexes, (task.projectSeq ?? 1) + 2);
            const assignee = assigneeIndex
                ? this.usersByIndex.get(assigneeIndex)
                : null;
            if (!assignee)
                continue;
            if (!memberIds.has(assignee.id)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'taskAssignees', {
                    skipped: 1,
                    reason: `assignee ${assignee.email} is not workspace member`,
                });
                continue;
            }
            const key = `${task.id}:${assignee.id}`;
            if (existingKeys.has(key)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'taskAssignees', { existing: 1 });
                continue;
            }
            toCreate.push(repo.create({
                taskId: task.id,
                userId: assignee.id,
                assignedBy: this.usersByIndex.get(state.spec.ownerUserIndex)?.id ?? null,
            }));
        }
        await this.saveCreated(repo, toCreate, 'taskAssignees');
    }
    async seedTaskPositions(project, tasks, manager) {
        if (!tasks.length)
            return;
        const repo = manager.getRepository(task_position_entity_1.TaskPosition);
        const existing = await repo.find({
            where: { taskId: (0, typeorm_1.In)(tasks.map((task) => task.id)) },
        });
        const existingKeys = new Set(existing.map((item) => `${item.taskId}:${item.context}:${item.contextId}`));
        const contexts = new Map();
        for (const task of tasks) {
            this.addTaskToPositionContext(contexts, 'list', project.id, task);
            this.addTaskToPositionContext(contexts, 'kanban', task.statusId, task);
            if (task.sprintId) {
                this.addTaskToPositionContext(contexts, 'sprint', task.sprintId, task);
            }
            else {
                this.addTaskToPositionContext(contexts, 'backlog', project.id, task);
            }
        }
        const toCreate = [];
        for (const [contextKey, contextTasks] of contexts.entries()) {
            const [context, contextId] = contextKey.split(':');
            const sortedTasks = contextTasks.sort((a, b) => (a.projectSeq ?? 0) - (b.projectSeq ?? 0));
            for (const [index, task] of sortedTasks.entries()) {
                const key = `${task.id}:${context}:${contextId}`;
                if (existingKeys.has(key)) {
                    (0, demo_seed_helper_1.addReport)(this.report, 'taskPositions', { existing: 1 });
                    continue;
                }
                toCreate.push(repo.create({
                    taskId: task.id,
                    context: context,
                    contextId,
                    position: (0, demo_seed_helper_1.seededPosition)(index),
                }));
            }
        }
        await this.saveCreated(repo, toCreate, 'taskPositions');
    }
    addTaskToPositionContext(contexts, context, contextId, task) {
        const key = `${context}:${contextId}`;
        const list = contexts.get(key) ?? [];
        list.push(task);
        contexts.set(key, list);
    }
    async seedComments(state, tasks, manager) {
        if (!tasks.length)
            return;
        const repo = manager.getRepository(task_commnent_entity_1.TaskComment);
        const commentTasks = tasks.filter((task) => (task.projectSeq ?? 0) % 5 === 0);
        if (commentTasks.length === 0) {
            return;
        }
        const existing = await repo
            .createQueryBuilder('comment')
            .where('comment.task_id IN (:...taskIds)', {
            taskIds: commentTasks.map((task) => task.id),
        })
            .andWhere('comment.content LIKE :marker', {
            marker: `${demo_seed_constants_1.DEMO_SEED_MARKER}%[COMMENT:%`,
        })
            .getMany();
        const existingMarkers = new Set(existing.map((comment) => this.extractCommentSeedId(comment.content)));
        const toCreate = [];
        for (const task of commentTasks) {
            const seedId = (0, demo_seed_helper_1.demoSeedId)('comment', task.id, 1);
            if (existingMarkers.has(seedId)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'comments', { existing: 1 });
                continue;
            }
            const author = this.pick(state.members, (task.projectSeq ?? 1) + state.spec.index) ??
                state.members[0];
            toCreate.push(repo.create({
                workspaceId: task.workspaceId,
                projectId: task.projectId,
                taskId: task.id,
                authorId: author.id,
                content: `${demo_seed_constants_1.DEMO_SEED_MARKER}[COMMENT:${seedId}] ${faker_1.faker.lorem.sentences(2)}`,
                isEdited: false,
            }));
        }
        await this.saveCreated(repo, toCreate, 'comments');
    }
    extractCommentSeedId(content) {
        const match = /\[COMMENT:([^\]]+)\]/.exec(content);
        return match?.[1] ?? null;
    }
    async seedActivities(state, project, sprints, tasks, board, manager) {
        const repo = manager.getRepository(activity_entity_1.Activity);
        const actorId = this.usersByIndex.get(state.spec.ownerUserIndex)?.id ?? null;
        const specs = [
            {
                seedId: (0, demo_seed_helper_1.demoSeedId)('project-created', project.id),
                workspaceId: state.workspace.id,
                projectId: project.id,
                entityType: activity_entity_1.ActivityEntityType.PROJECT,
                entityId: project.id,
                action: activity_entity_1.ActivityAction.PROJECT_CREATED,
                metadata: { projectKey: project.key },
            },
            {
                seedId: (0, demo_seed_helper_1.demoSeedId)('board-created', board.id),
                workspaceId: state.workspace.id,
                projectId: project.id,
                entityType: activity_entity_1.ActivityEntityType.PROJECT,
                entityId: project.id,
                action: activity_entity_1.ActivityAction.PROJECT_UPDATED,
                metadata: { boardId: board.id },
            },
            ...sprints.slice(0, 2).map((sprint) => ({
                seedId: (0, demo_seed_helper_1.demoSeedId)('sprint', sprint.id, sprint.status),
                workspaceId: state.workspace.id,
                projectId: project.id,
                entityType: activity_entity_1.ActivityEntityType.SPRINT,
                entityId: sprint.id,
                action: sprint.status === sprint_entity_1.SprintStatus.COMPLETED
                    ? activity_entity_1.ActivityAction.SPRINT_COMPLETED
                    : sprint.status === sprint_entity_1.SprintStatus.ACTIVE
                        ? activity_entity_1.ActivityAction.SPRINT_STARTED
                        : activity_entity_1.ActivityAction.SPRINT_CREATED,
                metadata: { sprintName: sprint.name, sprintStatus: sprint.status },
            })),
            ...tasks.slice(0, 2).map((task) => ({
                seedId: (0, demo_seed_helper_1.demoSeedId)('task-created', task.id),
                workspaceId: state.workspace.id,
                projectId: project.id,
                entityType: activity_entity_1.ActivityEntityType.TASK,
                entityId: task.id,
                action: activity_entity_1.ActivityAction.TASK_CREATED,
                metadata: { taskTitle: task.title, projectSeq: task.projectSeq },
            })),
        ];
        const existing = await repo
            .createQueryBuilder('activity')
            .where("activity.metadata ->> 'seedKey' = :seedKey", {
            seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
        })
            .andWhere('activity.workspace_id = :workspaceId', {
            workspaceId: state.workspace.id,
        })
            .getMany();
        const existingIds = new Set(existing.map((activity) => activity.metadata?.seedId));
        const toCreate = specs
            .filter((spec) => {
            if (existingIds.has(spec.seedId)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'activities', { existing: 1 });
                return false;
            }
            return true;
        })
            .map((spec) => repo.create({
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
                seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
                seedId: spec.seedId,
                ...spec.metadata,
            },
            isSystem: false,
        }));
        await this.saveCreated(repo, toCreate, 'activities');
    }
    async seedNotifications(state, tasks, manager) {
        if (!tasks.length)
            return;
        const repo = manager.getRepository(notification_entity_1.Notification);
        const assigneeRepo = manager.getRepository(task_assignee_entity_1.TaskAssignee);
        const selectedTasks = tasks.filter((task) => (task.projectSeq ?? 0) % 7 === 0);
        const assignees = selectedTasks.length
            ? await assigneeRepo.find({
                where: { taskId: (0, typeorm_1.In)(selectedTasks.map((task) => task.id)) },
            })
            : [];
        const assigneeByTask = new Map(assignees.map((assignee) => [assignee.taskId, assignee]));
        const existing = await repo
            .createQueryBuilder('notification')
            .where("notification.metadata ->> 'seedKey' = :seedKey", {
            seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
        })
            .andWhere('notification.workspace_id = :workspaceId', {
            workspaceId: state.workspace.id,
        })
            .getMany();
        const existingIds = new Set(existing.map((notification) => notification.metadata?.seedId));
        const toCreate = [];
        for (const task of selectedTasks) {
            const assignee = assigneeByTask.get(task.id);
            if (!assignee)
                continue;
            const seedId = (0, demo_seed_helper_1.demoSeedId)('notification-task-assigned', task.id);
            if (existingIds.has(seedId)) {
                (0, demo_seed_helper_1.addReport)(this.report, 'notifications', { existing: 1 });
                continue;
            }
            toCreate.push(repo.create({
                receiverId: assignee.userId,
                senderType: notification_entity_1.NotificationSenderType.USER,
                actorId: assignee.assignedBy,
                sourceType: notification_entity_1.NotificationSourceType.TASK,
                workspaceId: task.workspaceId,
                projectId: task.projectId,
                taskId: task.id,
                sprintId: task.sprintId,
                commentId: null,
                type: notification_entity_1.NotificationType.TASK_ASSIGNED,
                title: 'You were assigned a demo task',
                message: task.title,
                actionUrl: `/workspaces/${task.workspaceId}/projects/${task.projectId}/tasks/${task.id}`,
                metadata: {
                    seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
                    seedId,
                    taskSeq: task.projectSeq,
                },
                readAt: null,
                archivedAt: null,
            }));
        }
        await this.saveCreated(repo, toCreate, 'notifications');
    }
    async seedUsageLimits(state, plan, manager) {
        const repo = manager.getRepository(usage_limit_entity_1.UsageLimit);
        const limits = default_plan_limits_constant_1.DEFAULT_PLAN_LIMITS[plan.slug] ?? default_plan_limits_constant_1.DEFAULT_PLAN_LIMITS[default_plan_limits_constant_1.FREE_PLAN_SLUG];
        const usedValues = {
            [usage_limit_entity_1.UsageResourceType.MEMBERS]: state.members.length,
            [usage_limit_entity_1.UsageResourceType.PROJECTS]: state.projects.length,
            [usage_limit_entity_1.UsageResourceType.TASKS]: state.projects.reduce((sum, item) => sum + item.tasks.length, 0),
            [usage_limit_entity_1.UsageResourceType.PAGES]: 0,
            [usage_limit_entity_1.UsageResourceType.PAGE_TEMPLATES]: 0,
            [usage_limit_entity_1.UsageResourceType.STORAGE_MB]: 0,
            [usage_limit_entity_1.UsageResourceType.ATTACHMENTS]: 0,
            [usage_limit_entity_1.UsageResourceType.SPRINTS]: state.projects.reduce((sum, item) => sum + item.sprints.length, 0),
        };
        const existing = await repo.find({
            where: { workspaceId: state.workspace.id },
        });
        const byResource = new Map(existing.map((item) => [item.resourceType, item]));
        const toCreate = [];
        const toUpdate = [];
        for (const resourceType of Object.values(usage_limit_entity_1.UsageResourceType)) {
            const limitKey = this.resourceLimitKey(resourceType);
            const existed = byResource.get(resourceType);
            const limitValue = limits[limitKey] ?? null;
            if (existed) {
                existed.planId = plan?.id ?? null;
                existed.limitValue = limitValue;
                existed.usedValue = usedValues[resourceType] ?? 0;
                existed.metadata = {
                    seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
                    planSlug: plan.slug,
                };
                toUpdate.push(existed);
                (0, demo_seed_helper_1.addReport)(this.report, 'usageLimits', { existing: 1 });
                continue;
            }
            toCreate.push(repo.create({
                workspaceId: state.workspace.id,
                planId: plan?.id ?? null,
                resourceType,
                limitValue,
                usedValue: usedValues[resourceType] ?? 0,
                resetAt: null,
                metadata: {
                    seedKey: demo_seed_constants_1.DEMO_SEED_KEY,
                    planSlug: plan.slug,
                },
            }));
        }
        if (toUpdate.length) {
            await repo.save(toUpdate, { chunk: demo_seed_config_1.DEMO_SEED_CONFIG.batchSize });
        }
        await this.saveCreated(repo, toCreate, 'usageLimits');
    }
    resourceLimitKey(resourceType) {
        const map = {
            [usage_limit_entity_1.UsageResourceType.MEMBERS]: 'members',
            [usage_limit_entity_1.UsageResourceType.PROJECTS]: 'projects',
            [usage_limit_entity_1.UsageResourceType.TASKS]: 'tasks',
            [usage_limit_entity_1.UsageResourceType.PAGES]: 'pages',
            [usage_limit_entity_1.UsageResourceType.PAGE_TEMPLATES]: 'pageTemplates',
            [usage_limit_entity_1.UsageResourceType.STORAGE_MB]: 'storageMb',
            [usage_limit_entity_1.UsageResourceType.ATTACHMENTS]: 'attachments',
            [usage_limit_entity_1.UsageResourceType.SPRINTS]: 'sprints',
        };
        return map[resourceType];
    }
    async validateSeededData() {
        const checks = [
            {
                name: 'tasks have projects',
                sql: `
          SELECT COUNT(*)::int AS count
          FROM tasks t
          LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.title LIKE '${demo_seed_constants_1.DEMO_SEED_MARKER}%'
            AND p.id IS NULL
        `,
            },
            {
                name: 'sprints have projects',
                sql: `
          SELECT COUNT(*)::int AS count
          FROM sprints s
          LEFT JOIN projects p ON p.id = s.project_id
          WHERE s.name LIKE '${demo_seed_constants_1.DEMO_SEED_MARKER}%'
            AND p.id IS NULL
        `,
            },
            {
                name: 'task reporters are workspace members',
                sql: `
          SELECT COUNT(*)::int AS count
          FROM tasks t
          WHERE t.title LIKE '${demo_seed_constants_1.DEMO_SEED_MARKER}%'
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
          WHERE t.title LIKE '${demo_seed_constants_1.DEMO_SEED_MARKER}%'
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
          WHERE t.title LIKE '${demo_seed_constants_1.DEMO_SEED_MARKER}%'
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
          WHERE c.content LIKE '${demo_seed_constants_1.DEMO_SEED_MARKER}%[COMMENT:%'
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
          WHERE u.email LIKE 'demo.v1.user.%@${demo_seed_constants_1.DEMO_SEED_EMAIL_DOMAIN}'
            AND r.workspace_id <> ur.workspace_id
        `,
            },
        ];
        for (const check of checks) {
            const rows = await this.ds.query(check.sql);
            const count = Number(rows?.[0]?.count ?? 0);
            if (count > 0) {
                (0, demo_seed_helper_1.addReport)(this.report, 'validations', {
                    failed: count,
                    reason: check.name,
                });
            }
            else {
                (0, demo_seed_helper_1.addReport)(this.report, 'validations', { existing: 1 });
            }
        }
    }
    async analyzeSeededTables() {
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
    async saveCreated(repo, entities, table) {
        if (!entities.length)
            return [];
        const saved = [];
        for (const chunk of (0, demo_seed_helper_1.chunkArray)(entities, demo_seed_config_1.DEMO_SEED_CONFIG.batchSize)) {
            saved.push(...(await repo.save(chunk, { chunk: demo_seed_config_1.DEMO_SEED_CONFIG.batchSize })));
        }
        (0, demo_seed_helper_1.addReport)(this.report, table, { created: entities.length });
        return saved;
    }
    distribute(total, buckets) {
        const base = Math.floor(total / buckets);
        const remainder = total % buckets;
        return Array.from({ length: buckets }, (_, index) => base + (index < remainder ? 1 : 0));
    }
    pick(items, seed) {
        return items[(seed - 1) % items.length];
    }
}
async function bootstrap() {
    const seeder = new DemoLargeSeeder(data_source_1.default);
    await seeder.run();
}
bootstrap().catch((error) => {
    console.error('Demo seed failed:', error);
    process.exitCode = 1;
});


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("dotenv/config");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("reflect-metadata");

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@faker-js/faker");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RESOURCE_LIMIT_KEY_MAP = exports.DEFAULT_PLAN_LIMITS = exports.PRO_PLAN_SLUG = exports.FREE_PLAN_SLUG = void 0;
const usage_limit_entity_1 = __webpack_require__(5);
exports.FREE_PLAN_SLUG = 'free';
exports.PRO_PLAN_SLUG = 'pro-monthly';
exports.DEFAULT_PLAN_LIMITS = {
    [exports.FREE_PLAN_SLUG]: {
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
    [exports.PRO_PLAN_SLUG]: {
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
exports.RESOURCE_LIMIT_KEY_MAP = {
    [usage_limit_entity_1.UsageResourceType.MEMBERS]: 'members',
    [usage_limit_entity_1.UsageResourceType.PROJECTS]: 'projects',
    [usage_limit_entity_1.UsageResourceType.TASKS]: 'tasks',
    [usage_limit_entity_1.UsageResourceType.PAGES]: 'pages',
    [usage_limit_entity_1.UsageResourceType.PAGE_TEMPLATES]: 'pageTemplates',
    [usage_limit_entity_1.UsageResourceType.STORAGE_MB]: 'storageMb',
    [usage_limit_entity_1.UsageResourceType.ATTACHMENTS]: 'attachments',
    [usage_limit_entity_1.UsageResourceType.SPRINTS]: 'sprints',
};


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsageLimit = exports.UsageResourceType = void 0;
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
const plan_entity_1 = __webpack_require__(18);
var UsageResourceType;
(function (UsageResourceType) {
    UsageResourceType["MEMBERS"] = "MEMBERS";
    UsageResourceType["PROJECTS"] = "PROJECTS";
    UsageResourceType["TASKS"] = "TASKS";
    UsageResourceType["PAGES"] = "PAGES";
    UsageResourceType["PAGE_TEMPLATES"] = "PAGE_TEMPLATES";
    UsageResourceType["STORAGE_MB"] = "STORAGE_MB";
    UsageResourceType["ATTACHMENTS"] = "ATTACHMENTS";
    UsageResourceType["SPRINTS"] = "SPRINTS";
})(UsageResourceType || (exports.UsageResourceType = UsageResourceType = {}));
let UsageLimit = class UsageLimit {
    id;
    workspaceId;
    workspace;
    planId;
    plan;
    resourceType;
    limitValue;
    usedValue;
    resetAt;
    metadata;
    createdAt;
    updatedAt;
};
exports.UsageLimit = UsageLimit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UsageLimit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], UsageLimit.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_a = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _a : Object)
], UsageLimit.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], UsageLimit.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", Object)
], UsageLimit.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'resource_type',
        type: 'enum',
        enum: UsageResourceType,
    }),
    __metadata("design:type", String)
], UsageLimit.prototype, "resourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'limit_value', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], UsageLimit.prototype, "limitValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'used_value', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], UsageLimit.prototype, "usedValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reset_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], UsageLimit.prototype, "resetAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], UsageLimit.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], UsageLimit.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], UsageLimit.prototype, "updatedAt", void 0);
exports.UsageLimit = UsageLimit = __decorate([
    (0, typeorm_1.Entity)('usage_limits'),
    (0, typeorm_1.Index)(['workspaceId', 'resourceType'], { unique: true }),
    (0, typeorm_1.Index)(['planId'])
], UsageLimit);


/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Workspace = exports.WorkspaceLayoutMode = exports.PlanTypeWorkspace = void 0;
const project_entity_1 = __webpack_require__(7);
const user_workspace_entity_1 = __webpack_require__(17);
const typeorm_1 = __webpack_require__(11);
var PlanTypeWorkspace;
(function (PlanTypeWorkspace) {
    PlanTypeWorkspace["FREE"] = "free";
    PlanTypeWorkspace["PRO"] = "pro";
})(PlanTypeWorkspace || (exports.PlanTypeWorkspace = PlanTypeWorkspace = {}));
var WorkspaceLayoutMode;
(function (WorkspaceLayoutMode) {
    WorkspaceLayoutMode["TABS"] = "tabs";
    WorkspaceLayoutMode["BLOCKS"] = "blocks";
})(WorkspaceLayoutMode || (exports.WorkspaceLayoutMode = WorkspaceLayoutMode = {}));
let Workspace = class Workspace {
    id;
    name;
    slug;
    planType;
    layoutMode;
    projects;
    userWorkspaces;
    createdAt;
    updatedAt;
    deletedAt;
    deletedBy;
    createdBy;
};
exports.Workspace = Workspace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Workspace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Workspace.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], Workspace.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PlanTypeWorkspace,
        default: PlanTypeWorkspace.FREE,
        name: 'plan_type',
    }),
    __metadata("design:type", String)
], Workspace.prototype, "planType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkspaceLayoutMode,
        default: WorkspaceLayoutMode.TABS,
        name: 'layout_mode',
    }),
    __metadata("design:type", String)
], Workspace.prototype, "layoutMode", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => project_entity_1.Project, (project) => project.workspace),
    __metadata("design:type", Array)
], Workspace.prototype, "projects", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_workspace_entity_1.UserWorkspace, (userWorkspace) => userWorkspace.workspace),
    __metadata("design:type", Array)
], Workspace.prototype, "userWorkspaces", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Workspace.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Workspace.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Object)
], Workspace.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Workspace.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Workspace.prototype, "createdBy", void 0);
exports.Workspace = Workspace = __decorate([
    (0, typeorm_1.Entity)('workspaces'),
    (0, typeorm_1.Index)('IDX_WORKSPACES_DELETED_AT', ['deletedAt'])
], Workspace);


/***/ }),
/* 7 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Project = exports.ProjectVisibility = void 0;
const board_entity_1 = __webpack_require__(8);
const sprint_entity_1 = __webpack_require__(12);
const task_entity_1 = __webpack_require__(13);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
var ProjectVisibility;
(function (ProjectVisibility) {
    ProjectVisibility["PRIVATE"] = "PRIVATE";
    ProjectVisibility["INTERNAL"] = "INTERNAL";
})(ProjectVisibility || (exports.ProjectVisibility = ProjectVisibility = {}));
let Project = class Project {
    id;
    workspace_id;
    name;
    key;
    visibility;
    task_seq;
    created_by;
    created_at;
    updated_at;
    deleted_at;
    deleted_by;
    workspace;
    creator;
    sprints;
    boards;
    tasks;
};
exports.Project = Project;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Project.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], Project.prototype, "workspace_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Project.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'key', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Project.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'visibility',
        type: 'enum',
        enum: ProjectVisibility,
        default: ProjectVisibility.PRIVATE,
    }),
    __metadata("design:type", String)
], Project.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_seq', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Project.prototype, "task_seq", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], Project.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Project.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Project.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Project.prototype, "deleted_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, (workspace) => workspace.projects, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_d = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _d : Object)
], Project.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", typeof (_e = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _e : Object)
], Project.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sprint_entity_1.Sprint, (sprint) => sprint.project),
    __metadata("design:type", Array)
], Project.prototype, "sprints", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => board_entity_1.Board, (board) => board.project),
    __metadata("design:type", Array)
], Project.prototype, "boards", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.project),
    __metadata("design:type", Array)
], Project.prototype, "tasks", void 0);
exports.Project = Project = __decorate([
    (0, typeorm_1.Entity)('projects'),
    (0, typeorm_1.Index)('UQ_PROJECTS_WORKSPACE_KEY_ACTIVE', ['workspace_id', 'key'], {
        unique: true,
        where: '"deleted_at" IS NULL',
    }),
    (0, typeorm_1.Index)('IDX_PROJECTS_WORKSPACE_ID', ['workspace_id']),
    (0, typeorm_1.Index)('IDX_PROJECTS_DELETED_AT', ['deleted_at'])
], Project);


/***/ }),
/* 8 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Board = exports.BoardViewType = void 0;
const project_entity_1 = __webpack_require__(7);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
var BoardViewType;
(function (BoardViewType) {
    BoardViewType["BOARD"] = "BOARD";
    BoardViewType["TABLE"] = "TABLE";
    BoardViewType["LIST"] = "LIST";
    BoardViewType["CALENDAR"] = "CALENDAR";
    BoardViewType["TIMELINE"] = "TIMELINE";
    BoardViewType["GALLERY"] = "GALLERY";
    BoardViewType["CHART"] = "CHART";
    BoardViewType["DASHBOARD"] = "DASHBOARD";
    BoardViewType["FORM"] = "FORM";
    BoardViewType["MAP"] = "MAP";
    BoardViewType["FEED"] = "FEED";
    BoardViewType["BACKLOG"] = "BACKLOG";
})(BoardViewType || (exports.BoardViewType = BoardViewType = {}));
let Board = class Board {
    id;
    workspaceId;
    projectId;
    name;
    viewType;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    deletedAt;
    deletedBy;
    workspace;
    project;
    creator;
    updater;
};
exports.Board = Board;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Board.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], Board.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid' }),
    __metadata("design:type", String)
], Board.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Board.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'view_type',
        type: 'enum',
        enum: BoardViewType,
        default: BoardViewType.BOARD,
    }),
    __metadata("design:type", String)
], Board.prototype, "viewType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], Board.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Board.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Board.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Board.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Board.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Board.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_d = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _d : Object)
], Board.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.boards, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", typeof (_e = typeof project_entity_1.Project !== "undefined" && project_entity_1.Project) === "function" ? _e : Object)
], Board.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", typeof (_f = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _f : Object)
], Board.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", Object)
], Board.prototype, "updater", void 0);
exports.Board = Board = __decorate([
    (0, typeorm_1.Entity)('boards'),
    (0, typeorm_1.Index)('IDX_BOARDS_WORKSPACE_ID', ['workspaceId']),
    (0, typeorm_1.Index)('IDX_BOARDS_PROJECT_ID', ['projectId']),
    (0, typeorm_1.Index)('IDX_BOARDS_DELETED_AT', ['deletedAt']),
    (0, typeorm_1.Index)('UQ_BOARDS_PROJECT_NAME_ACTIVE', ['projectId', 'name'], {
        unique: true,
        where: '"deleted_at" IS NULL',
    })
], Board);


/***/ }),
/* 9 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.User = exports.SystemRole = void 0;
const user_profile_entity_1 = __webpack_require__(10);
const typeorm_1 = __webpack_require__(11);
var SystemRole;
(function (SystemRole) {
    SystemRole["USER"] = "USER";
    SystemRole["SYSTEM_ADMIN"] = "SYSTEM_ADMIN";
    SystemRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(SystemRole || (exports.SystemRole = SystemRole = {}));
let User = class User {
    id;
    email;
    username;
    googleId;
    avatarUrl;
    passwordHash;
    isActive;
    isEmailVerified;
    emailVerificationToken;
    emailVerificationExpires;
    resetPasswordToken;
    resetPasswordExpires;
    systemRole;
    createdAt;
    updatedAt;
    deletedAt;
    profile;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ name: 'google_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "googleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'password_hash',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_email_verified', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isEmailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'email_verification_token',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "emailVerificationToken", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'email_verification_expires',
        type: 'timestamp',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "emailVerificationExpires", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'reset_password_token',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "resetPasswordToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reset_password_expires', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "resetPasswordExpires", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'system_role',
        type: 'enum',
        enum: SystemRole,
        default: SystemRole.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "systemRole", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_profile_entity_1.UserProfile, (profile) => profile.user),
    __metadata("design:type", typeof (_f = typeof user_profile_entity_1.UserProfile !== "undefined" && user_profile_entity_1.UserProfile) === "function" ? _f : Object)
], User.prototype, "profile", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);


/***/ }),
/* 10 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserProfile = void 0;
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
let UserProfile = class UserProfile {
    id;
    userId;
    user;
    displayName;
    fullName;
    bio;
    phoneNumber;
    location;
    jobTitle;
    website;
    coverUrl;
    timezone;
    language;
    createdAt;
    updatedAt;
};
exports.UserProfile = UserProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', unique: true }),
    __metadata("design:type", String)
], UserProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], UserProfile.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'display_name',
        type: 'varchar',
        length: 150,
        nullable: true,
    }),
    __metadata("design:type", Object)
], UserProfile.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'phone_number', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'job_title', type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "jobTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cover_url', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "coverUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], UserProfile.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], UserProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserProfile.prototype, "updatedAt", void 0);
exports.UserProfile = UserProfile = __decorate([
    (0, typeorm_1.Entity)('user_profiles')
], UserProfile);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("typeorm");

/***/ }),
/* 12 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sprint = exports.SprintStatus = void 0;
const project_entity_1 = __webpack_require__(7);
const task_entity_1 = __webpack_require__(13);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
var SprintStatus;
(function (SprintStatus) {
    SprintStatus["PLANNED"] = "PLANNED";
    SprintStatus["ACTIVE"] = "ACTIVE";
    SprintStatus["COMPLETED"] = "COMPLETED";
    SprintStatus["CANCELLED"] = "CANCELLED";
})(SprintStatus || (exports.SprintStatus = SprintStatus = {}));
let Sprint = class Sprint {
    id;
    workspaceId;
    projectId;
    name;
    goal;
    status;
    startAt;
    endAt;
    completedAt;
    createdBy;
    workspace;
    project;
    creator;
    tasks;
    createdAt;
    updatedAt;
    deletedAt;
    deletedBy;
};
exports.Sprint = Sprint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Sprint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], Sprint.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid' }),
    __metadata("design:type", String)
], Sprint.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Sprint.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'goal', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], Sprint.prototype, "goal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status',
        type: 'enum',
        enum: SprintStatus,
        default: SprintStatus.PLANNED,
    }),
    __metadata("design:type", String)
], Sprint.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Sprint.prototype, "startAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'end_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Sprint.prototype, "endAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Sprint.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid' }),
    __metadata("design:type", String)
], Sprint.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_d = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _d : Object)
], Sprint.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.sprints, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", typeof (_e = typeof project_entity_1.Project !== "undefined" && project_entity_1.Project) === "function" ? _e : Object)
], Sprint.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", typeof (_f = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _f : Object)
], Sprint.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.sprint),
    __metadata("design:type", Array)
], Sprint.prototype, "tasks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], Sprint.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], Sprint.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Object)
], Sprint.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Sprint.prototype, "deletedBy", void 0);
exports.Sprint = Sprint = __decorate([
    (0, typeorm_1.Entity)('sprints'),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['projectId']),
    (0, typeorm_1.Index)(['workspaceId', 'projectId']),
    (0, typeorm_1.Index)('IDX_SPRINTS_DELETED_AT', ['deletedAt']),
    (0, typeorm_1.Index)('UQ_SPRINTS_PROJECT_NAME_ACTIVE', ['projectId', 'name'], {
        unique: true,
        where: '"deleted_at" IS NULL',
    })
], Sprint);


/***/ }),
/* 13 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Task = void 0;
const project_entity_1 = __webpack_require__(7);
const sprint_entity_1 = __webpack_require__(12);
const task_assignee_entity_1 = __webpack_require__(14);
const task_priority_entity_1 = __webpack_require__(15);
const task_status_entity_1 = __webpack_require__(16);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
let Task = class Task {
    id;
    workspaceId;
    projectId;
    parentTaskId;
    sprintId;
    projectSeq;
    title;
    description;
    statusId;
    priorityId;
    createdBy;
    startAt;
    dueAt;
    completedAt;
    estimateMinutes;
    createdAt;
    updatedAt;
    deletedAt;
    deletedBy;
    workspace;
    parentTask;
    subtasks;
    project;
    sprint;
    status;
    priority;
    reporter;
    assignees;
};
exports.Task = Task;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Task.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], Task.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid' }),
    __metadata("design:type", String)
], Task.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_task_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "parentTaskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sprint_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "sprintId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_seq', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "projectSeq", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'title', type: 'varchar', length: 255, nullable: true, default: '' }),
    __metadata("design:type", Object)
], Task.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'description', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_id', type: 'uuid' }),
    __metadata("design:type", String)
], Task.prototype, "statusId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'priority_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "priorityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reporter_id', type: 'uuid' }),
    __metadata("design:type", String)
], Task.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "startAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "dueAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estimate_minutes', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "estimateMinutes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Task.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], Task.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Task.prototype, "deletedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_g = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _g : Object)
], Task.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Task, (task) => task.subtasks, {
        nullable: true,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_task_id' }),
    __metadata("design:type", Object)
], Task.prototype, "parentTask", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Task, (task) => task.parentTask),
    __metadata("design:type", Array)
], Task.prototype, "subtasks", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.tasks, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", typeof (_h = typeof project_entity_1.Project !== "undefined" && project_entity_1.Project) === "function" ? _h : Object)
], Task.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sprint_entity_1.Sprint, (sprint) => sprint.tasks, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sprint_id' }),
    __metadata("design:type", Object)
], Task.prototype, "sprint", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_status_entity_1.TaskStatus, (status) => status.tasks, {
        onDelete: 'RESTRICT',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'status_id' }),
    __metadata("design:type", typeof (_k = typeof task_status_entity_1.TaskStatus !== "undefined" && task_status_entity_1.TaskStatus) === "function" ? _k : Object)
], Task.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_priority_entity_1.TaskPriority, (priority) => priority.tasks, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'priority_id' }),
    __metadata("design:type", Object)
], Task.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'reporter_id' }),
    __metadata("design:type", typeof (_m = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _m : Object)
], Task.prototype, "reporter", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_assignee_entity_1.TaskAssignee, (taskAssignee) => taskAssignee.task),
    __metadata("design:type", Array)
], Task.prototype, "assignees", void 0);
exports.Task = Task = __decorate([
    (0, typeorm_1.Entity)('tasks'),
    (0, typeorm_1.Index)('UQ_TASKS_PROJECT_SEQ', ['projectId', 'projectSeq'], { unique: true }),
    (0, typeorm_1.Index)('IDX_TASKS_WORKSPACE_ID', ['workspaceId']),
    (0, typeorm_1.Index)('IDX_TASKS_PROJECT_ID', ['projectId']),
    (0, typeorm_1.Index)('IDX_TASKS_PARENT_TASK_ID', ['parentTaskId']),
    (0, typeorm_1.Index)('IDX_TASKS_STATUS_ID', ['statusId']),
    (0, typeorm_1.Index)('IDX_TASKS_PRIORITY_ID', ['priorityId']),
    (0, typeorm_1.Index)('IDX_TASKS_CREATED_BY', ['createdBy']),
    (0, typeorm_1.Index)('IDX_TASKS_SPRINT_ID', ['sprintId']),
    (0, typeorm_1.Index)('IDX_TASKS_DELETED_AT', ['deletedAt'])
], Task);


/***/ }),
/* 14 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskAssignee = void 0;
const task_entity_1 = __webpack_require__(13);
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
let TaskAssignee = class TaskAssignee {
    id;
    taskId;
    userId;
    assignedBy;
    assignedAt;
    task;
    user;
    assignedByUser;
};
exports.TaskAssignee = TaskAssignee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaskAssignee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskAssignee.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskAssignee.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], TaskAssignee.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'assigned_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TaskAssignee.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, (task) => task.assignees, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", typeof (_b = typeof task_entity_1.Task !== "undefined" && task_entity_1.Task) === "function" ? _b : Object)
], TaskAssignee.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_c = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _c : Object)
], TaskAssignee.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_by' }),
    __metadata("design:type", Object)
], TaskAssignee.prototype, "assignedByUser", void 0);
exports.TaskAssignee = TaskAssignee = __decorate([
    (0, typeorm_1.Entity)('task_assignees'),
    (0, typeorm_1.Index)('UQ_TASK_ASSIGNEES_TASK_USER', ['taskId', 'userId'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('IDX_TASK_ASSIGNEES_TASK_ID', ['taskId']),
    (0, typeorm_1.Index)('IDX_TASK_ASSIGNEES_USER_ID', ['userId']),
    (0, typeorm_1.Index)('IDX_TASK_ASSIGNEES_ASSIGNED_BY', ['assignedBy'])
], TaskAssignee);


/***/ }),
/* 15 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskPriority = void 0;
const project_entity_1 = __webpack_require__(7);
const task_entity_1 = __webpack_require__(13);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
let TaskPriority = class TaskPriority {
    id;
    workspaceId;
    projectId;
    name;
    level;
    color;
    createdAt;
    updatedAt;
    workspace;
    project;
    tasks;
};
exports.TaskPriority = TaskPriority;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaskPriority.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskPriority.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskPriority.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TaskPriority.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'level', type: 'int' }),
    __metadata("design:type", Number)
], TaskPriority.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'color', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], TaskPriority.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TaskPriority.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TaskPriority.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_c = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _c : Object)
], TaskPriority.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", typeof (_d = typeof project_entity_1.Project !== "undefined" && project_entity_1.Project) === "function" ? _d : Object)
], TaskPriority.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.priority),
    __metadata("design:type", Array)
], TaskPriority.prototype, "tasks", void 0);
exports.TaskPriority = TaskPriority = __decorate([
    (0, typeorm_1.Entity)('task_priorities'),
    (0, typeorm_1.Index)(['projectId', 'name'], { unique: true }),
    (0, typeorm_1.Index)(['projectId', 'level'], { unique: true })
], TaskPriority);


/***/ }),
/* 16 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskStatus = void 0;
const project_entity_1 = __webpack_require__(7);
const task_entity_1 = __webpack_require__(13);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
let TaskStatus = class TaskStatus {
    id;
    workspaceId;
    projectId;
    name;
    position;
    color;
    isDone;
    createdAt;
    updatedAt;
    workspace;
    project;
    tasks;
};
exports.TaskStatus = TaskStatus;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaskStatus.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskStatus.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskStatus.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TaskStatus.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'position', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TaskStatus.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'color', type: 'varchar', length: 30, nullable: true }),
    __metadata("design:type", Object)
], TaskStatus.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_done', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TaskStatus.prototype, "isDone", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TaskStatus.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TaskStatus.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_c = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _c : Object)
], TaskStatus.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", typeof (_d = typeof project_entity_1.Project !== "undefined" && project_entity_1.Project) === "function" ? _d : Object)
], TaskStatus.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.status),
    __metadata("design:type", Array)
], TaskStatus.prototype, "tasks", void 0);
exports.TaskStatus = TaskStatus = __decorate([
    (0, typeorm_1.Entity)('task_statuses'),
    (0, typeorm_1.Index)(['projectId', 'name'], { unique: true })
], TaskStatus);


/***/ }),
/* 17 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserWorkspace = void 0;
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
let UserWorkspace = class UserWorkspace {
    id;
    workspace_id;
    user_id;
    workspace;
    user;
    joinedAt;
    lastOpenedAt;
};
exports.UserWorkspace = UserWorkspace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserWorkspace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserWorkspace.prototype, "workspace_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], UserWorkspace.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_a = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _a : Object)
], UserWorkspace.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE', nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], UserWorkspace.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'joined_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], UserWorkspace.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', name: 'last_opened_at', nullable: true }),
    __metadata("design:type", Object)
], UserWorkspace.prototype, "lastOpenedAt", void 0);
exports.UserWorkspace = UserWorkspace = __decorate([
    (0, typeorm_1.Entity)('user_workspaces'),
    (0, typeorm_1.Index)('UQ_user_workspaces_workspace_user', ['workspace_id', 'user_id'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('IDX_user_workspaces_user_id', ['user_id']),
    (0, typeorm_1.Index)('IDX_user_workspaces_workspace_id', ['workspace_id'])
], UserWorkspace);


/***/ }),
/* 18 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Plan = exports.PlanBillingInterval = void 0;
const typeorm_1 = __webpack_require__(11);
var PlanBillingInterval;
(function (PlanBillingInterval) {
    PlanBillingInterval["MONTH"] = "MONTH";
    PlanBillingInterval["YEAR"] = "YEAR";
    PlanBillingInterval["LIFETIME"] = "LIFETIME";
})(PlanBillingInterval || (exports.PlanBillingInterval = PlanBillingInterval = {}));
let Plan = class Plan {
    id;
    name;
    slug;
    description;
    priceAmount;
    currency;
    billingInterval;
    features;
    limits;
    isActive;
    sortOrder;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Plan = Plan;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Plan.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Plan.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Plan.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Plan.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'price_amount', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Plan.prototype, "priceAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'VND' }),
    __metadata("design:type", String)
], Plan.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'billing_interval',
        type: 'enum',
        enum: PlanBillingInterval,
        default: PlanBillingInterval.MONTH,
    }),
    __metadata("design:type", String)
], Plan.prototype, "billingInterval", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Plan.prototype, "features", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Plan.prototype, "limits", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Plan.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Plan.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Plan.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Plan.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], Plan.prototype, "deletedAt", void 0);
exports.Plan = Plan = __decorate([
    (0, typeorm_1.Entity)('plans'),
    (0, typeorm_1.Index)(['slug'], { unique: true }),
    (0, typeorm_1.Index)(['isActive'])
], Plan);


/***/ }),
/* 19 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SubscriptionWorkspace = void 0;
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
const subscription_entity_1 = __webpack_require__(20);
let SubscriptionWorkspace = class SubscriptionWorkspace {
    id;
    subscriptionId;
    subscription;
    workspaceId;
    workspace;
    activatedAt;
    createdAt;
    updatedAt;
};
exports.SubscriptionWorkspace = SubscriptionWorkspace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SubscriptionWorkspace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subscription_id', type: 'uuid' }),
    __metadata("design:type", String)
], SubscriptionWorkspace.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subscription_entity_1.Subscription, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", typeof (_a = typeof subscription_entity_1.Subscription !== "undefined" && subscription_entity_1.Subscription) === "function" ? _a : Object)
], SubscriptionWorkspace.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], SubscriptionWorkspace.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_b = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _b : Object)
], SubscriptionWorkspace.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activated_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SubscriptionWorkspace.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], SubscriptionWorkspace.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], SubscriptionWorkspace.prototype, "updatedAt", void 0);
exports.SubscriptionWorkspace = SubscriptionWorkspace = __decorate([
    (0, typeorm_1.Entity)('subscription_workspaces'),
    (0, typeorm_1.Index)(['subscriptionId']),
    (0, typeorm_1.Index)(['workspaceId'], { unique: true }),
    (0, typeorm_1.Index)(['subscriptionId', 'workspaceId'], { unique: true })
], SubscriptionWorkspace);


/***/ }),
/* 20 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Subscription = exports.SubscriptionStatus = exports.BillingProvider = void 0;
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
const plan_entity_1 = __webpack_require__(18);
var BillingProvider;
(function (BillingProvider) {
    BillingProvider["MANUAL"] = "MANUAL";
    BillingProvider["MOMO"] = "MOMO";
    BillingProvider["VNPAY"] = "VNPAY";
    BillingProvider["STRIPE"] = "STRIPE";
})(BillingProvider || (exports.BillingProvider = BillingProvider = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIALING"] = "TRIALING";
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["INCOMPLETE"] = "INCOMPLETE";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
let Subscription = class Subscription {
    id;
    userId;
    user;
    planId;
    plan;
    provider;
    providerSubscriptionId;
    status;
    currentPeriodStart;
    currentPeriodEnd;
    trialEnd;
    cancelAtPeriodEnd;
    cancelledAt;
    metadata;
    createdAt;
    updatedAt;
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Subscription.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Subscription.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id', type: 'uuid' }),
    __metadata("design:type", String)
], Subscription.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", typeof (_b = typeof plan_entity_1.Plan !== "undefined" && plan_entity_1.Plan) === "function" ? _b : Object)
], Subscription.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BillingProvider,
        default: BillingProvider.MANUAL,
    }),
    __metadata("design:type", String)
], Subscription.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'provider_subscription_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Subscription.prototype, "providerSubscriptionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_period_start', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "currentPeriodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_period_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "currentPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trial_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "trialEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancel_at_period_end', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Subscription.prototype, "cancelAtPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], Subscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_j = typeof Date !== "undefined" && Date) === "function" ? _j : Object)
], Subscription.prototype, "updatedAt", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)('subscriptions'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['planId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['userId', 'status']),
    (0, typeorm_1.Index)(['provider', 'providerSubscriptionId'])
], Subscription);


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mergePlanLimits = mergePlanLimits;
exports.getNumberLimit = getNumberLimit;
exports.getNullableNumberLimit = getNullableNumberLimit;
const default_plan_limits_constant_1 = __webpack_require__(4);
function mergePlanLimits(plan) {
    if (!plan) {
        return default_plan_limits_constant_1.DEFAULT_PLAN_LIMITS[default_plan_limits_constant_1.FREE_PLAN_SLUG];
    }
    const defaultLimits = default_plan_limits_constant_1.DEFAULT_PLAN_LIMITS[plan.slug] ?? {};
    const customLimits = plan.limits ?? {};
    return {
        ...defaultLimits,
        ...customLimits,
    };
}
function getNumberLimit(limits, key, defaultValue) {
    const value = limits?.[key];
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return defaultValue;
}
function getNullableNumberLimit(limits, key) {
    const value = limits[key];
    if (value === null) {
        return null;
    }
    if (value === undefined) {
        return undefined;
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return undefined;
}


/***/ }),
/* 22 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Activity = exports.ActivityAction = exports.ActivityEntityType = void 0;
const typeorm_1 = __webpack_require__(11);
var ActivityEntityType;
(function (ActivityEntityType) {
    ActivityEntityType["TASK"] = "TASK";
    ActivityEntityType["SPRINT"] = "SPRINT";
    ActivityEntityType["COMMENT"] = "COMMENT";
    ActivityEntityType["ATTACHMENT"] = "ATTACHMENT";
    ActivityEntityType["PAGE"] = "PAGE";
    ActivityEntityType["PAGE_BLOCK"] = "PAGE_BLOCK";
    ActivityEntityType["WORKSPACE"] = "WORKSPACE";
    ActivityEntityType["PROJECT"] = "PROJECT";
})(ActivityEntityType || (exports.ActivityEntityType = ActivityEntityType = {}));
var ActivityAction;
(function (ActivityAction) {
    ActivityAction["TASK_CREATED"] = "TASK_CREATED";
    ActivityAction["TASK_UPDATED"] = "TASK_UPDATED";
    ActivityAction["TASK_DELETED"] = "TASK_DELETED";
    ActivityAction["TASK_RESTORED"] = "TASK_RESTORED";
    ActivityAction["TASK_STATUS_CHANGED"] = "TASK_STATUS_CHANGED";
    ActivityAction["TASK_PRIORITY_CHANGED"] = "TASK_PRIORITY_CHANGED";
    ActivityAction["TASK_TITLE_CHANGED"] = "TASK_TITLE_CHANGED";
    ActivityAction["TASK_DESCRIPTION_CHANGED"] = "TASK_DESCRIPTION_CHANGED";
    ActivityAction["TASK_DUE_DATE_CHANGED"] = "TASK_DUE_DATE_CHANGED";
    ActivityAction["TASK_START_DATE_CHANGED"] = "TASK_START_DATE_CHANGED";
    ActivityAction["TASK_ESTIMATE_CHANGED"] = "TASK_ESTIMATE_CHANGED";
    ActivityAction["TASK_ASSIGNED"] = "TASK_ASSIGNED";
    ActivityAction["TASK_UNASSIGNED"] = "TASK_UNASSIGNED";
    ActivityAction["TASK_MOVED_TO_SPRINT"] = "TASK_MOVED_TO_SPRINT";
    ActivityAction["TASK_REMOVED_FROM_SPRINT"] = "TASK_REMOVED_FROM_SPRINT";
    ActivityAction["TASK_MOVED_TO_BACKLOG"] = "TASK_MOVED_TO_BACKLOG";
    ActivityAction["SPRINT_CREATED"] = "SPRINT_CREATED";
    ActivityAction["SPRINT_UPDATED"] = "SPRINT_UPDATED";
    ActivityAction["SPRINT_STARTED"] = "SPRINT_STARTED";
    ActivityAction["SPRINT_COMPLETED"] = "SPRINT_COMPLETED";
    ActivityAction["SPRINT_CANCELLED"] = "SPRINT_CANCELLED";
    ActivityAction["SPRINT_DELETED"] = "SPRINT_DELETED";
    ActivityAction["SPRINT_RESTORED"] = "SPRINT_RESTORED";
    ActivityAction["COMMENT_CREATED"] = "COMMENT_CREATED";
    ActivityAction["COMMENT_UPDATED"] = "COMMENT_UPDATED";
    ActivityAction["COMMENT_DELETED"] = "COMMENT_DELETED";
    ActivityAction["ATTACHMENT_UPLOADED"] = "ATTACHMENT_UPLOADED";
    ActivityAction["ATTACHMENT_DELETED"] = "ATTACHMENT_DELETED";
    ActivityAction["PAGE_CREATED"] = "PAGE_CREATED";
    ActivityAction["PAGE_UPDATED"] = "PAGE_UPDATED";
    ActivityAction["PAGE_DELETED"] = "PAGE_DELETED";
    ActivityAction["PAGE_RESTORED"] = "PAGE_RESTORED";
    ActivityAction["PAGE_BLOCK_CREATED"] = "PAGE_BLOCK_CREATED";
    ActivityAction["PAGE_BLOCK_UPDATED"] = "PAGE_BLOCK_UPDATED";
    ActivityAction["PAGE_BLOCK_DELETED"] = "PAGE_BLOCK_DELETED";
    ActivityAction["PAGE_BLOCK_REORDERED"] = "PAGE_BLOCK_REORDERED";
    ActivityAction["WORKSPACE_MEMBER_JOINED"] = "WORKSPACE_MEMBER_JOINED";
    ActivityAction["WORKSPACE_MEMBER_REMOVED"] = "WORKSPACE_MEMBER_REMOVED";
    ActivityAction["WORKSPACE_MEMBER_ROLE_CHANGED"] = "WORKSPACE_MEMBER_ROLE_CHANGED";
    ActivityAction["PROJECT_CREATED"] = "PROJECT_CREATED";
    ActivityAction["PROJECT_UPDATED"] = "PROJECT_UPDATED";
    ActivityAction["PROJECT_DELETED"] = "PROJECT_DELETED";
    ActivityAction["PROJECT_RESTORED"] = "PROJECT_RESTORED";
})(ActivityAction || (exports.ActivityAction = ActivityAction = {}));
let Activity = class Activity {
    id;
    workspaceId;
    projectId;
    entityType;
    entityId;
    actorId;
    action;
    field;
    oldValue;
    newValue;
    metadata;
    isSystem;
    createdAt;
};
exports.Activity = Activity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Activity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], Activity.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Activity.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'entity_type',
        type: 'enum',
        enum: ActivityEntityType,
    }),
    __metadata("design:type", String)
], Activity.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', type: 'uuid' }),
    __metadata("design:type", String)
], Activity.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Activity.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'action',
        type: 'enum',
        enum: ActivityAction,
    }),
    __metadata("design:type", String)
], Activity.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'field', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Activity.prototype, "field", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'old_value', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Activity.prototype, "oldValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'new_value', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Activity.prototype, "newValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Activity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_system', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Activity.prototype, "isSystem", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Activity.prototype, "createdAt", void 0);
exports.Activity = Activity = __decorate([
    (0, typeorm_1.Entity)('activities'),
    (0, typeorm_1.Index)(['workspaceId', 'entityType', 'entityId']),
    (0, typeorm_1.Index)(['workspaceId', 'projectId']),
    (0, typeorm_1.Index)(['workspaceId', 'createdAt']),
    (0, typeorm_1.Index)(['actorId'])
], Activity);


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeatureKey = void 0;
var FeatureKey;
(function (FeatureKey) {
    FeatureKey["SPRINT_ENABLED"] = "sprint:enabled";
})(FeatureKey || (exports.FeatureKey = FeatureKey = {}));


/***/ }),
/* 24 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Feature = void 0;
const typeorm_1 = __webpack_require__(11);
let Feature = class Feature {
    id;
    code;
    name;
    description;
    category;
    isActive;
    metadata;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Feature = Feature;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Feature.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Feature.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Feature.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Feature.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80, nullable: true }),
    __metadata("design:type", Object)
], Feature.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Feature.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Feature.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Feature.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Feature.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Object)
], Feature.prototype, "deletedAt", void 0);
exports.Feature = Feature = __decorate([
    (0, typeorm_1.Entity)('features'),
    (0, typeorm_1.Index)(['code'], { unique: true }),
    (0, typeorm_1.Index)(['isActive'])
], Feature);


/***/ }),
/* 25 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Notification = exports.NotificationType = exports.NotificationSourceType = exports.NotificationSenderType = void 0;
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
var NotificationSenderType;
(function (NotificationSenderType) {
    NotificationSenderType["SYSTEM"] = "SYSTEM";
    NotificationSenderType["USER"] = "USER";
})(NotificationSenderType || (exports.NotificationSenderType = NotificationSenderType = {}));
var NotificationSourceType;
(function (NotificationSourceType) {
    NotificationSourceType["SYSTEM"] = "SYSTEM";
    NotificationSourceType["ACCOUNT"] = "ACCOUNT";
    NotificationSourceType["WORKSPACE"] = "WORKSPACE";
    NotificationSourceType["PROJECT"] = "PROJECT";
    NotificationSourceType["TASK"] = "TASK";
    NotificationSourceType["SPRINT"] = "SPRINT";
    NotificationSourceType["COMMENT"] = "COMMENT";
})(NotificationSourceType || (exports.NotificationSourceType = NotificationSourceType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["SYSTEM_ANNOUNCEMENT"] = "SYSTEM_ANNOUNCEMENT";
    NotificationType["SYSTEM_MAINTENANCE"] = "SYSTEM_MAINTENANCE";
    NotificationType["ACCOUNT_SECURITY"] = "ACCOUNT_SECURITY";
    NotificationType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    NotificationType["EMAIL_VERIFIED"] = "EMAIL_VERIFIED";
    NotificationType["WORKSPACE_INVITE"] = "WORKSPACE_INVITE";
    NotificationType["WORKSPACE_INVITE_ACCEPTED"] = "WORKSPACE_INVITE_ACCEPTED";
    NotificationType["WORKSPACE_MEMBER_JOINED"] = "WORKSPACE_MEMBER_JOINED";
    NotificationType["WORKSPACE_MEMBER_REMOVED"] = "WORKSPACE_MEMBER_REMOVED";
    NotificationType["PROJECT_CREATED"] = "PROJECT_CREATED";
    NotificationType["PROJECT_UPDATED"] = "PROJECT_UPDATED";
    NotificationType["TASK_ASSIGNED"] = "TASK_ASSIGNED";
    NotificationType["TASK_UPDATED"] = "TASK_UPDATED";
    NotificationType["TASK_DUE_SOON"] = "TASK_DUE_SOON";
    NotificationType["TASK_OVERDUE"] = "TASK_OVERDUE";
    NotificationType["SPRINT_STARTED"] = "SPRINT_STARTED";
    NotificationType["SPRINT_COMPLETED"] = "SPRINT_COMPLETED";
    NotificationType["SPRINT_DUE_SOON"] = "SPRINT_DUE_SOON";
    NotificationType["SPRINT_OVERDUE"] = "SPRINT_OVERDUE";
    NotificationType["COMMENT_MENTION"] = "COMMENT_MENTION";
    NotificationType["COMMENT_REPLY"] = "COMMENT_REPLY";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let Notification = class Notification {
    id;
    receiverId;
    receiver;
    senderType;
    actorId;
    actor;
    sourceType;
    workspaceId;
    projectId;
    taskId;
    sprintId;
    commentId;
    type;
    title;
    message;
    actionUrl;
    metadata;
    readAt;
    archivedAt;
    createdAt;
    updatedAt;
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'receiver_id', type: 'uuid' }),
    __metadata("design:type", String)
], Notification.prototype, "receiverId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'receiver_id' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Notification.prototype, "receiver", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'sender_type',
        type: 'enum',
        enum: NotificationSenderType,
        default: NotificationSenderType.SYSTEM,
    }),
    __metadata("design:type", String)
], Notification.prototype, "senderType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'actor_id' }),
    __metadata("design:type", Object)
], Notification.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'source_type',
        type: 'enum',
        enum: NotificationSourceType,
        default: NotificationSourceType.SYSTEM,
    }),
    __metadata("design:type", String)
], Notification.prototype, "sourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sprint_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "sprintId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comment_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "commentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: NotificationType }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Notification.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'action_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "actionUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'read_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'archived_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "archivedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], Notification.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], Notification.prototype, "updatedAt", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)('notifications'),
    (0, typeorm_1.Index)('IDX_notifications_receiver_created_at', ['receiverId', 'createdAt']),
    (0, typeorm_1.Index)('IDX_notifications_receiver_read_at', ['receiverId', 'readAt']),
    (0, typeorm_1.Index)('IDX_notifications_workspace_id', ['workspaceId']),
    (0, typeorm_1.Index)('IDX_notifications_project_id', ['projectId']),
    (0, typeorm_1.Index)('IDX_notifications_task_id', ['taskId'])
], Notification);


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PERMISSION_SEED_DATA = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    WORKSPACE_READ: 'workspace.read',
    WORKSPACE_UPDATE: 'workspace.update',
    WORKSPACE_DELETE: 'workspace.delete',
    WORKSPACE_BILLING_READ: 'workspace.billing.read',
    WORKSPACE_BILLING_MANAGE: 'workspace.billing.manage',
    WORKSPACE_USAGE_READ: 'workspace.usage.read',
    WORKSPACE_FEATURE_READ: 'workspace.feature.read',
    WORKSPACE_FEATURE_UPDATE: 'workspace.feature.update',
    WORKSPACE_MEMBER_READ: 'workspace.member.read',
    WORKSPACE_MEMBER_ADD: 'workspace.member.add',
    WORKSPACE_MEMBER_UPDATE_ROLE: 'workspace.member.update_role',
    WORKSPACE_MEMBER_REMOVE: 'workspace.member.remove',
    WORKSPACE_ROLE_MANAGE: 'workspace.role.manage',
    PROJECT_CREATE: 'project.create',
    PROJECT_READ: 'project.read',
    PROJECT_UPDATE: 'project.update',
    PROJECT_DELETE: 'project.delete',
    BOARD_CREATE: 'board.create',
    BOARD_READ: 'board.read',
    BOARD_UPDATE: 'board.update',
    BOARD_DELETE: 'board.delete',
    TASK_CREATE: 'task.create',
    TASK_READ: 'task.read',
    TASK_UPDATE: 'task.update',
    TASK_DELETE: 'task.delete',
    TASK_ASSIGNEE_ADD: 'task.assignee.add',
    TASK_ASSIGNEE_REMOVE: 'task.assignee.remove',
    TASK_COMMENT_CREATE: 'task.comment.create',
    TASK_COMMENT_READ: 'task.comment.read',
    TASK_COMMENT_UPDATE: 'task.comment.update',
    TASK_COMMENT_DELETE: 'task.comment.delete',
    SPRINT_CREATE: 'sprint.create',
    SPRINT_READ: 'sprint.read',
    SPRINT_UPDATE: 'sprint.update',
    SPRINT_DELETE: 'sprint.delete',
    SPRINT_START: 'sprint.start',
    SPRINT_COMPLETE: 'sprint.complete',
    SPRINT_CANCEL: 'sprint.cancel',
    PAGE_CREATE: 'page.create',
    PAGE_READ: 'page.read',
    PAGE_UPDATE: 'page.update',
    PAGE_DELETE: 'page.delete',
    PAGE_BLOCK_CREATE: 'page_block.create',
    PAGE_BLOCK_READ: 'page_block.read',
    PAGE_BLOCK_UPDATE: 'page_block.update',
    PAGE_BLOCK_DELETE: 'page_block.delete',
    TASK_STATUS_READ: 'task_status.read',
    TASK_STATUS_MANAGE: 'task_status.manage',
    TASK_PRIORITY_READ: 'task_priority.read',
    TASK_PRIORITY_MANAGE: 'task_priority.manage',
    ATTACHMENT_UPLOAD: 'attachment.upload',
    ATTACHMENT_READ: 'attachment.read',
    ATTACHMENT_DELETE: 'attachment.delete',
    ACTIVITY_READ: 'activity.read',
    AUDIT_LOG_READ: 'audit_log.read',
};
exports.PERMISSION_SEED_DATA = [
    { code: exports.PERMISSIONS.WORKSPACE_READ, description: 'Read workspace' },
    { code: exports.PERMISSIONS.WORKSPACE_UPDATE, description: 'Update workspace' },
    { code: exports.PERMISSIONS.WORKSPACE_DELETE, description: 'Delete workspace' },
    {
        code: exports.PERMISSIONS.WORKSPACE_BILLING_READ,
        description: 'Read workspace billing',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_BILLING_MANAGE,
        description: 'Manage workspace billing',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_USAGE_READ,
        description: 'Read workspace usage limits',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_FEATURE_READ,
        description: 'Read workspace features',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_FEATURE_UPDATE,
        description: 'Update workspace features',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_MEMBER_READ,
        description: 'Read workspace members',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_MEMBER_ADD,
        description: 'Add member to workspace',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_MEMBER_UPDATE_ROLE,
        description: 'Update member role in workspace',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_MEMBER_REMOVE,
        description: 'Remove member from workspace',
    },
    {
        code: exports.PERMISSIONS.WORKSPACE_ROLE_MANAGE,
        description: 'Manage workspace roles',
    },
    { code: exports.PERMISSIONS.PROJECT_CREATE, description: 'Create project' },
    { code: exports.PERMISSIONS.PROJECT_READ, description: 'Read project' },
    { code: exports.PERMISSIONS.PROJECT_UPDATE, description: 'Update project' },
    { code: exports.PERMISSIONS.PROJECT_DELETE, description: 'Delete project' },
    { code: exports.PERMISSIONS.BOARD_CREATE, description: 'Create board' },
    { code: exports.PERMISSIONS.BOARD_READ, description: 'Read board' },
    { code: exports.PERMISSIONS.BOARD_UPDATE, description: 'Update board' },
    { code: exports.PERMISSIONS.BOARD_DELETE, description: 'Delete board' },
    { code: exports.PERMISSIONS.TASK_CREATE, description: 'Create task' },
    { code: exports.PERMISSIONS.TASK_READ, description: 'Read task' },
    { code: exports.PERMISSIONS.TASK_UPDATE, description: 'Update task' },
    { code: exports.PERMISSIONS.TASK_DELETE, description: 'Delete task' },
    {
        code: exports.PERMISSIONS.TASK_ASSIGNEE_ADD,
        description: 'Assign task members',
    },
    {
        code: exports.PERMISSIONS.TASK_ASSIGNEE_REMOVE,
        description: 'Unassign task members',
    },
    {
        code: exports.PERMISSIONS.TASK_COMMENT_CREATE,
        description: 'Create task comment',
    },
    {
        code: exports.PERMISSIONS.TASK_COMMENT_READ,
        description: 'Read task comments',
    },
    {
        code: exports.PERMISSIONS.TASK_COMMENT_UPDATE,
        description: 'Update task comment',
    },
    {
        code: exports.PERMISSIONS.TASK_COMMENT_DELETE,
        description: 'Delete task comment',
    },
    { code: exports.PERMISSIONS.SPRINT_CREATE, description: 'Create sprint' },
    { code: exports.PERMISSIONS.SPRINT_READ, description: 'Read sprint' },
    { code: exports.PERMISSIONS.SPRINT_UPDATE, description: 'Update sprint' },
    { code: exports.PERMISSIONS.SPRINT_DELETE, description: 'Delete sprint' },
    { code: exports.PERMISSIONS.SPRINT_START, description: 'Start sprint' },
    { code: exports.PERMISSIONS.SPRINT_COMPLETE, description: 'Complete sprint' },
    { code: exports.PERMISSIONS.SPRINT_CANCEL, description: 'Cancel sprint' },
    { code: exports.PERMISSIONS.PAGE_CREATE, description: 'Create page' },
    { code: exports.PERMISSIONS.PAGE_READ, description: 'Read page' },
    { code: exports.PERMISSIONS.PAGE_UPDATE, description: 'Update page' },
    { code: exports.PERMISSIONS.PAGE_DELETE, description: 'Delete page' },
    { code: exports.PERMISSIONS.PAGE_BLOCK_CREATE, description: 'Create page block' },
    { code: exports.PERMISSIONS.PAGE_BLOCK_READ, description: 'Read page block' },
    { code: exports.PERMISSIONS.PAGE_BLOCK_UPDATE, description: 'Update page block' },
    { code: exports.PERMISSIONS.PAGE_BLOCK_DELETE, description: 'Delete page block' },
    { code: exports.PERMISSIONS.TASK_STATUS_READ, description: 'Read task status' },
    {
        code: exports.PERMISSIONS.TASK_STATUS_MANAGE,
        description: 'Manage task statuses',
    },
    { code: exports.PERMISSIONS.TASK_PRIORITY_READ, description: 'Read task priority' },
    {
        code: exports.PERMISSIONS.TASK_PRIORITY_MANAGE,
        description: 'Manage task priorities',
    },
    { code: exports.PERMISSIONS.ATTACHMENT_UPLOAD, description: 'Upload attachment' },
    { code: exports.PERMISSIONS.ATTACHMENT_READ, description: 'Read attachment' },
    { code: exports.PERMISSIONS.ATTACHMENT_DELETE, description: 'Delete attachment' },
    { code: exports.PERMISSIONS.ACTIVITY_READ, description: 'Read activity logs' },
    { code: exports.PERMISSIONS.AUDIT_LOG_READ, description: 'Read audit logs' },
];


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ROLE_PERMISSION_MAP = void 0;
const permission_constant_1 = __webpack_require__(26);
const role_entity_1 = __webpack_require__(28);
exports.ROLE_PERMISSION_MAP = {
    [role_entity_1.RoleName.OWNER]: Object.values(permission_constant_1.PERMISSIONS),
    [role_entity_1.RoleName.ADMIN]: [
        permission_constant_1.PERMISSIONS.WORKSPACE_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_UPDATE,
        permission_constant_1.PERMISSIONS.WORKSPACE_BILLING_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_USAGE_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_FEATURE_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_FEATURE_UPDATE,
        permission_constant_1.PERMISSIONS.WORKSPACE_MEMBER_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_MEMBER_ADD,
        permission_constant_1.PERMISSIONS.WORKSPACE_MEMBER_UPDATE_ROLE,
        permission_constant_1.PERMISSIONS.WORKSPACE_MEMBER_REMOVE,
        permission_constant_1.PERMISSIONS.PROJECT_CREATE,
        permission_constant_1.PERMISSIONS.PROJECT_READ,
        permission_constant_1.PERMISSIONS.PROJECT_UPDATE,
        permission_constant_1.PERMISSIONS.PROJECT_DELETE,
        permission_constant_1.PERMISSIONS.BOARD_CREATE,
        permission_constant_1.PERMISSIONS.BOARD_READ,
        permission_constant_1.PERMISSIONS.BOARD_UPDATE,
        permission_constant_1.PERMISSIONS.BOARD_DELETE,
        permission_constant_1.PERMISSIONS.TASK_CREATE,
        permission_constant_1.PERMISSIONS.TASK_READ,
        permission_constant_1.PERMISSIONS.TASK_UPDATE,
        permission_constant_1.PERMISSIONS.TASK_DELETE,
        permission_constant_1.PERMISSIONS.TASK_ASSIGNEE_ADD,
        permission_constant_1.PERMISSIONS.TASK_ASSIGNEE_REMOVE,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_CREATE,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_READ,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_UPDATE,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_DELETE,
        permission_constant_1.PERMISSIONS.SPRINT_CREATE,
        permission_constant_1.PERMISSIONS.SPRINT_READ,
        permission_constant_1.PERMISSIONS.SPRINT_UPDATE,
        permission_constant_1.PERMISSIONS.SPRINT_DELETE,
        permission_constant_1.PERMISSIONS.SPRINT_START,
        permission_constant_1.PERMISSIONS.SPRINT_COMPLETE,
        permission_constant_1.PERMISSIONS.SPRINT_CANCEL,
        permission_constant_1.PERMISSIONS.PAGE_CREATE,
        permission_constant_1.PERMISSIONS.PAGE_READ,
        permission_constant_1.PERMISSIONS.PAGE_UPDATE,
        permission_constant_1.PERMISSIONS.PAGE_DELETE,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_CREATE,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_READ,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_UPDATE,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_DELETE,
        permission_constant_1.PERMISSIONS.TASK_STATUS_READ,
        permission_constant_1.PERMISSIONS.TASK_STATUS_MANAGE,
        permission_constant_1.PERMISSIONS.TASK_PRIORITY_READ,
        permission_constant_1.PERMISSIONS.TASK_PRIORITY_MANAGE,
        permission_constant_1.PERMISSIONS.ATTACHMENT_UPLOAD,
        permission_constant_1.PERMISSIONS.ATTACHMENT_READ,
        permission_constant_1.PERMISSIONS.ATTACHMENT_DELETE,
        permission_constant_1.PERMISSIONS.ACTIVITY_READ,
        permission_constant_1.PERMISSIONS.AUDIT_LOG_READ,
    ],
    [role_entity_1.RoleName.MEMBER]: [
        permission_constant_1.PERMISSIONS.WORKSPACE_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_MEMBER_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_FEATURE_READ,
        permission_constant_1.PERMISSIONS.PROJECT_READ,
        permission_constant_1.PERMISSIONS.BOARD_READ,
        permission_constant_1.PERMISSIONS.BOARD_CREATE,
        permission_constant_1.PERMISSIONS.BOARD_UPDATE,
        permission_constant_1.PERMISSIONS.BOARD_DELETE,
        permission_constant_1.PERMISSIONS.TASK_READ,
        permission_constant_1.PERMISSIONS.TASK_CREATE,
        permission_constant_1.PERMISSIONS.TASK_UPDATE,
        permission_constant_1.PERMISSIONS.TASK_ASSIGNEE_ADD,
        permission_constant_1.PERMISSIONS.TASK_ASSIGNEE_REMOVE,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_CREATE,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_READ,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_UPDATE,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_DELETE,
        permission_constant_1.PERMISSIONS.SPRINT_READ,
        permission_constant_1.PERMISSIONS.PAGE_READ,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_CREATE,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_READ,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_UPDATE,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_DELETE,
        permission_constant_1.PERMISSIONS.TASK_STATUS_READ,
        permission_constant_1.PERMISSIONS.TASK_PRIORITY_READ,
        permission_constant_1.PERMISSIONS.ATTACHMENT_UPLOAD,
        permission_constant_1.PERMISSIONS.ATTACHMENT_READ,
        permission_constant_1.PERMISSIONS.ACTIVITY_READ,
    ],
    [role_entity_1.RoleName.VIEWER]: [
        permission_constant_1.PERMISSIONS.WORKSPACE_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_MEMBER_READ,
        permission_constant_1.PERMISSIONS.WORKSPACE_FEATURE_READ,
        permission_constant_1.PERMISSIONS.PROJECT_READ,
        permission_constant_1.PERMISSIONS.BOARD_READ,
        permission_constant_1.PERMISSIONS.TASK_READ,
        permission_constant_1.PERMISSIONS.TASK_COMMENT_READ,
        permission_constant_1.PERMISSIONS.SPRINT_READ,
        permission_constant_1.PERMISSIONS.PAGE_READ,
        permission_constant_1.PERMISSIONS.PAGE_BLOCK_READ,
        permission_constant_1.PERMISSIONS.TASK_STATUS_READ,
        permission_constant_1.PERMISSIONS.TASK_PRIORITY_READ,
        permission_constant_1.PERMISSIONS.ATTACHMENT_READ,
        permission_constant_1.PERMISSIONS.ACTIVITY_READ,
    ],
};


/***/ }),
/* 28 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Role = exports.RoleName = void 0;
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
var RoleName;
(function (RoleName) {
    RoleName["OWNER"] = "OWNER";
    RoleName["ADMIN"] = "ADMIN";
    RoleName["MEMBER"] = "MEMBER";
    RoleName["VIEWER"] = "VIEWER";
})(RoleName || (exports.RoleName = RoleName = {}));
let Role = class Role {
    id;
    name;
    workspace_id;
    workspace;
    created_at;
    updated_at;
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: RoleName }),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], Role.prototype, "workspace_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_a = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _a : Object)
], Role.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Role.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Role.prototype, "updated_at", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Index)('UQ_role_workspace_name', ['workspace_id', 'name'], { unique: true }),
    (0, typeorm_1.Entity)('roles')
], Role);


/***/ }),
/* 29 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Permission = void 0;
const typeorm_1 = __webpack_require__(11);
let Permission = class Permission {
    id;
    code;
    description;
    created_at;
};
exports.Permission = Permission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Permission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Permission.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Permission.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Permission.prototype, "created_at", void 0);
exports.Permission = Permission = __decorate([
    (0, typeorm_1.Entity)('permissions')
], Permission);


/***/ }),
/* 30 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlanFeature = void 0;
const plan_entity_1 = __webpack_require__(18);
const feature_entity_1 = __webpack_require__(24);
const typeorm_1 = __webpack_require__(11);
let PlanFeature = class PlanFeature {
    id;
    planId;
    plan;
    featureId;
    feature;
    enabled;
    metadata;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.PlanFeature = PlanFeature;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlanFeature.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id', type: 'uuid' }),
    __metadata("design:type", String)
], PlanFeature.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", typeof (_a = typeof plan_entity_1.Plan !== "undefined" && plan_entity_1.Plan) === "function" ? _a : Object)
], PlanFeature.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feature_id', type: 'uuid' }),
    __metadata("design:type", String)
], PlanFeature.prototype, "featureId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => feature_entity_1.Feature, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'feature_id' }),
    __metadata("design:type", typeof (_b = typeof feature_entity_1.Feature !== "undefined" && feature_entity_1.Feature) === "function" ? _b : Object)
], PlanFeature.prototype, "feature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PlanFeature.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PlanFeature.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], PlanFeature.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], PlanFeature.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Object)
], PlanFeature.prototype, "deletedAt", void 0);
exports.PlanFeature = PlanFeature = __decorate([
    (0, typeorm_1.Entity)('plan_features'),
    (0, typeorm_1.Index)(['planId', 'featureId'], { unique: true }),
    (0, typeorm_1.Index)(['planId']),
    (0, typeorm_1.Index)(['featureId']),
    (0, typeorm_1.Index)(['enabled'])
], PlanFeature);


/***/ }),
/* 31 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RolePermission = void 0;
const permission_entity_1 = __webpack_require__(29);
const typeorm_1 = __webpack_require__(11);
const role_entity_1 = __webpack_require__(28);
let RolePermission = class RolePermission {
    role_id;
    permission_id;
    role;
    permission;
};
exports.RolePermission = RolePermission;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], RolePermission.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], RolePermission.prototype, "permission_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", typeof (_a = typeof role_entity_1.Role !== "undefined" && role_entity_1.Role) === "function" ? _a : Object)
], RolePermission.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => permission_entity_1.Permission, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'permission_id' }),
    __metadata("design:type", typeof (_b = typeof permission_entity_1.Permission !== "undefined" && permission_entity_1.Permission) === "function" ? _b : Object)
], RolePermission.prototype, "permission", void 0);
exports.RolePermission = RolePermission = __decorate([
    (0, typeorm_1.Index)('IDX_role_permissions_role', ['role_id']),
    (0, typeorm_1.Index)('IDX_role_permissions_permission', ['permission_id']),
    (0, typeorm_1.Entity)('role_permissions')
], RolePermission);


/***/ }),
/* 32 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskComment = void 0;
const task_entity_1 = __webpack_require__(13);
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
let TaskComment = class TaskComment {
    id;
    workspaceId;
    projectId;
    taskId;
    authorId;
    content;
    isEdited;
    createdAt;
    updatedAt;
    task;
    author;
};
exports.TaskComment = TaskComment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaskComment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskComment.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskComment.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskComment.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'author_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskComment.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TaskComment.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_edited', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TaskComment.prototype, "isEdited", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TaskComment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TaskComment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", typeof (_c = typeof task_entity_1.Task !== "undefined" && task_entity_1.Task) === "function" ? _c : Object)
], TaskComment.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'author_id' }),
    __metadata("design:type", typeof (_d = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _d : Object)
], TaskComment.prototype, "author", void 0);
exports.TaskComment = TaskComment = __decorate([
    (0, typeorm_1.Entity)('task_comments'),
    (0, typeorm_1.Index)('IDX_TASK_COMMENTS_WORKSPACE_ID', ['workspaceId']),
    (0, typeorm_1.Index)('IDX_TASK_COMMENTS_PROJECT_ID', ['projectId']),
    (0, typeorm_1.Index)('IDX_TASK_COMMENTS_TASK_ID', ['taskId']),
    (0, typeorm_1.Index)('IDX_TASK_COMMENTS_AUTHOR_ID', ['authorId']),
    (0, typeorm_1.Index)('IDX_TASK_COMMENTS_TASK_CREATED_AT', ['taskId', 'createdAt'])
], TaskComment);


/***/ }),
/* 33 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskPosition = void 0;
const task_entity_1 = __webpack_require__(13);
const typeorm_1 = __webpack_require__(11);
let TaskPosition = class TaskPosition {
    id;
    taskId;
    context;
    contextId;
    position;
    createdAt;
    updatedAt;
    task;
};
exports.TaskPosition = TaskPosition;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TaskPosition.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskPosition.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'context', type: 'varchar', length: 20 }),
    __metadata("design:type", Object)
], TaskPosition.prototype, "context", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'context_id', type: 'uuid' }),
    __metadata("design:type", String)
], TaskPosition.prototype, "contextId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'position',
        type: 'numeric',
        precision: 30,
        scale: 15,
    }),
    __metadata("design:type", String)
], TaskPosition.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], TaskPosition.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], TaskPosition.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'task_id' }),
    __metadata("design:type", typeof (_c = typeof task_entity_1.Task !== "undefined" && task_entity_1.Task) === "function" ? _c : Object)
], TaskPosition.prototype, "task", void 0);
exports.TaskPosition = TaskPosition = __decorate([
    (0, typeorm_1.Entity)('task_positions'),
    (0, typeorm_1.Index)('UQ_TASK_POSITION', ['taskId', 'context', 'contextId'], {
        unique: true,
    }),
    (0, typeorm_1.Index)('IDX_TASK_POSITION_LOOKUP', ['context', 'contextId', 'position']),
    (0, typeorm_1.Index)('IDX_TASK_POSITION_TASK', ['taskId'])
], TaskPosition);


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_TASK_PRIORITIES = void 0;
exports.DEFAULT_TASK_PRIORITIES = [
    {
        name: 'Low',
        level: 1,
        color: '#94A3B8',
    },
    {
        name: 'Medium',
        level: 2,
        color: '#3B82F6',
    },
    {
        name: 'High',
        level: 3,
        color: '#F59E0B',
    },
    {
        name: 'Urgent',
        level: 4,
        color: '#EF4444',
    },
];


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_TASK_STATUSES = void 0;
exports.DEFAULT_TASK_STATUSES = [
    {
        name: 'Todo',
        position: 0,
        color: '#94A3B8',
        isDone: false,
    },
    {
        name: 'In Progress',
        position: 1,
        color: '#3B82F6',
        isDone: false,
    },
    {
        name: 'Done',
        position: 2,
        color: '#22C55E',
        isDone: true,
    },
];


/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserRole = void 0;
const role_entity_1 = __webpack_require__(28);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
let UserRole = class UserRole {
    user_id;
    workspace_id;
    role_id;
    assigned_at;
    assigned_by;
    user;
    workspace;
    role;
};
exports.UserRole = UserRole;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid', { name: 'user_id' }),
    __metadata("design:type", String)
], UserRole.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid', { name: 'workspace_id' }),
    __metadata("design:type", String)
], UserRole.prototype, "workspace_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid', { name: 'role_id' }),
    __metadata("design:type", String)
], UserRole.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'assigned_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], UserRole.prototype, "assigned_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], UserRole.prototype, "assigned_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], UserRole.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_c = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _c : Object)
], UserRole.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", typeof (_d = typeof role_entity_1.Role !== "undefined" && role_entity_1.Role) === "function" ? _d : Object)
], UserRole.prototype, "role", void 0);
exports.UserRole = UserRole = __decorate([
    (0, typeorm_1.Entity)('user_roles'),
    (0, typeorm_1.Index)('IDX_user_roles_workspace_user', ['workspace_id', 'user_id'])
], UserRole);


/***/ }),
/* 37 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkspaceFeatureSetting = void 0;
const feature_entity_1 = __webpack_require__(24);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
let WorkspaceFeatureSetting = class WorkspaceFeatureSetting {
    id;
    workspaceId;
    workspace;
    featureId;
    feature;
    enabled;
    createdBy;
    creator;
    updatedBy;
    updater;
    metadata;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.WorkspaceFeatureSetting = WorkspaceFeatureSetting;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkspaceFeatureSetting.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], WorkspaceFeatureSetting.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_a = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _a : Object)
], WorkspaceFeatureSetting.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'feature_id', type: 'uuid' }),
    __metadata("design:type", String)
], WorkspaceFeatureSetting.prototype, "featureId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => feature_entity_1.Feature, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'feature_id' }),
    __metadata("design:type", typeof (_b = typeof feature_entity_1.Feature !== "undefined" && feature_entity_1.Feature) === "function" ? _b : Object)
], WorkspaceFeatureSetting.prototype, "feature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], WorkspaceFeatureSetting.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceFeatureSetting.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", Object)
], WorkspaceFeatureSetting.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'updated_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceFeatureSetting.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'updated_by' }),
    __metadata("design:type", Object)
], WorkspaceFeatureSetting.prototype, "updater", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceFeatureSetting.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], WorkspaceFeatureSetting.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], WorkspaceFeatureSetting.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceFeatureSetting.prototype, "deletedAt", void 0);
exports.WorkspaceFeatureSetting = WorkspaceFeatureSetting = __decorate([
    (0, typeorm_1.Entity)('workspace_feature_settings'),
    (0, typeorm_1.Index)(['workspaceId', 'featureId'], { unique: true }),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['featureId']),
    (0, typeorm_1.Index)(['enabled'])
], WorkspaceFeatureSetting);


/***/ }),
/* 38 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hashToken = exports.hashPassword = exports.generateSlug = void 0;
const bcrypt_1 = __webpack_require__(39);
const crypto_1 = __webpack_require__(40);
const slugify_1 = __importDefault(__webpack_require__(41));
const hashPassword = (password) => {
    const salt = (0, bcrypt_1.genSaltSync)(10);
    const hash = (0, bcrypt_1.hashSync)(password, salt);
    return hash;
};
exports.hashPassword = hashPassword;
const hashToken = (v) => {
    return (0, crypto_1.createHash)('sha256').update(v).digest('hex');
};
exports.hashToken = hashToken;
const generateSlug = (text) => {
    return (0, slugify_1.default)(text, {
        lower: true,
        locale: 'vi',
        strict: true,
    });
};
exports.generateSlug = generateSlug;


/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("slugify");

/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
__webpack_require__(1);
__webpack_require__(2);
const typeorm_1 = __webpack_require__(11);
const activity_entity_1 = __webpack_require__(22);
const ai_conversation_entity_1 = __webpack_require__(43);
const ai_generation_entity_1 = __webpack_require__(44);
const ai_message_entity_1 = __webpack_require__(48);
const attachment_entity_1 = __webpack_require__(50);
const audit_log_entity_1 = __webpack_require__(51);
const billing_webhook_entity_1 = __webpack_require__(52);
const invoice_entity_1 = __webpack_require__(53);
const payment_entity_1 = __webpack_require__(54);
const plan_entity_1 = __webpack_require__(18);
const subscription_workspace_entity_1 = __webpack_require__(19);
const subscription_entity_1 = __webpack_require__(20);
const usage_limit_entity_1 = __webpack_require__(5);
const board_entity_1 = __webpack_require__(8);
const feature_entity_1 = __webpack_require__(24);
const mention_entity_1 = __webpack_require__(55);
const notification_entity_1 = __webpack_require__(25);
const page_entity_1 = __webpack_require__(56);
const page_block_entity_1 = __webpack_require__(57);
const page_template_block_entity_1 = __webpack_require__(58);
const page_template_entity_1 = __webpack_require__(59);
const permission_entity_1 = __webpack_require__(29);
const plan_feature_entity_1 = __webpack_require__(30);
const project_entity_1 = __webpack_require__(7);
const refresh_token_entity_1 = __webpack_require__(61);
const role_entity_1 = __webpack_require__(28);
const role_permission_entity_1 = __webpack_require__(31);
const sprint_report_entity_1 = __webpack_require__(62);
const sprint_entity_1 = __webpack_require__(12);
const task_assignee_entity_1 = __webpack_require__(14);
const task_commnent_entity_1 = __webpack_require__(32);
const task_position_entity_1 = __webpack_require__(33);
const task_priority_entity_1 = __webpack_require__(15);
const task_status_entity_1 = __webpack_require__(16);
const task_entity_1 = __webpack_require__(13);
const user_activity_entity_1 = __webpack_require__(63);
const user_profile_entity_1 = __webpack_require__(10);
const user_role_entity_1 = __webpack_require__(36);
const user_workspace_entity_1 = __webpack_require__(17);
const user_entity_1 = __webpack_require__(9);
const workspace_feature_setting_entity_1 = __webpack_require__(37);
const workspace_invite_entity_1 = __webpack_require__(64);
const workspace_template_entity_1 = __webpack_require__(65);
const workspace_entity_1 = __webpack_require__(6);
exports["default"] = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    schema: 'public',
    synchronize: false,
    migrationsRun: false,
    logging: true,
    entities: [
        ai_conversation_entity_1.AiConversation,
        ai_message_entity_1.AiMessage,
        ai_generation_entity_1.AiGeneration,
        user_entity_1.User,
        user_activity_entity_1.UserActivity,
        workspace_entity_1.Workspace,
        permission_entity_1.Permission,
        role_entity_1.Role,
        role_permission_entity_1.RolePermission,
        user_profile_entity_1.UserProfile,
        refresh_token_entity_1.RefreshToken,
        user_workspace_entity_1.UserWorkspace,
        user_role_entity_1.UserRole,
        page_entity_1.Page,
        page_block_entity_1.PageBlock,
        project_entity_1.Project,
        sprint_entity_1.Sprint,
        sprint_report_entity_1.SprintReport,
        task_entity_1.Task,
        board_entity_1.Board,
        task_status_entity_1.TaskStatus,
        task_priority_entity_1.TaskPriority,
        workspace_invite_entity_1.WorkspaceInvite,
        task_assignee_entity_1.TaskAssignee,
        attachment_entity_1.Attachment,
        task_commnent_entity_1.TaskComment,
        activity_entity_1.Activity,
        audit_log_entity_1.AuditLog,
        billing_webhook_entity_1.BillingWebhook,
        invoice_entity_1.Invoice,
        payment_entity_1.Payment,
        plan_entity_1.Plan,
        subscription_entity_1.Subscription,
        subscription_workspace_entity_1.SubscriptionWorkspace,
        usage_limit_entity_1.UsageLimit,
        mention_entity_1.Mention,
        notification_entity_1.Notification,
        page_template_block_entity_1.PageTemplateBlock,
        page_template_entity_1.PageTemplate,
        feature_entity_1.Feature,
        plan_feature_entity_1.PlanFeature,
        workspace_feature_setting_entity_1.WorkspaceFeatureSetting,
        workspace_template_entity_1.WorkspaceTemplate,
        task_position_entity_1.TaskPosition,
    ],
    migrations: ['src/database/migrations/*{.ts,.js}'],
});


/***/ }),
/* 43 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiConversation = void 0;
const typeorm_1 = __webpack_require__(11);
const ai_generation_entity_1 = __webpack_require__(44);
const ai_message_entity_1 = __webpack_require__(48);
let AiConversation = class AiConversation {
    id;
    userId;
    workspaceId;
    title;
    lastMessageAt;
    messages;
    generations;
    createdAt;
    updatedAt;
};
exports.AiConversation = AiConversation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiConversation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], AiConversation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AiConversation.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], AiConversation.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AiConversation.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ai_message_entity_1.AiMessage, (message) => message.conversation),
    __metadata("design:type", Array)
], AiConversation.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ai_generation_entity_1.AiGeneration, (generation) => generation.conversation),
    __metadata("design:type", Array)
], AiConversation.prototype, "generations", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], AiConversation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], AiConversation.prototype, "updatedAt", void 0);
exports.AiConversation = AiConversation = __decorate([
    (0, typeorm_1.Entity)('ai_conversations'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['lastMessageAt'])
], AiConversation);


/***/ }),
/* 44 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiGeneration = void 0;
const typeorm_1 = __webpack_require__(11);
const ai_generation_status_enum_1 = __webpack_require__(45);
const ai_generation_type_enum_1 = __webpack_require__(46);
const ai_provider_enum_1 = __webpack_require__(47);
const ai_conversation_entity_1 = __webpack_require__(43);
let AiGeneration = class AiGeneration {
    id;
    userId;
    conversationId;
    conversation;
    requestMessageId;
    workspaceId;
    projectId;
    boardId;
    sprintId;
    generationType;
    inputText;
    inputContext;
    outputData;
    provider;
    model;
    status;
    appliedResults;
    inputTokens;
    outputTokens;
    totalTokens;
    errorMessage;
    appliedAt;
    createdAt;
    updatedAt;
};
exports.AiGeneration = AiGeneration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiGeneration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], AiGeneration.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_id', type: 'uuid' }),
    __metadata("design:type", String)
], AiGeneration.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ai_conversation_entity_1.AiConversation, (conversation) => conversation.generations, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'conversation_id' }),
    __metadata("design:type", typeof (_a = typeof ai_conversation_entity_1.AiConversation !== "undefined" && ai_conversation_entity_1.AiConversation) === "function" ? _a : Object)
], AiGeneration.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_message_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "requestMessageId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'board_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "boardId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sprint_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "sprintId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'generation_type',
        type: 'enum',
        enum: ai_generation_type_enum_1.AiGenerationType,
        enumName: 'ai_generation_type_enum',
    }),
    __metadata("design:type", typeof (_b = typeof ai_generation_type_enum_1.AiGenerationType !== "undefined" && ai_generation_type_enum_1.AiGenerationType) === "function" ? _b : Object)
], AiGeneration.prototype, "generationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'input_text', type: 'text' }),
    __metadata("design:type", String)
], AiGeneration.prototype, "inputText", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'input_context', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "inputContext", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'output_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "outputData", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ai_provider_enum_1.AiProvider,
        enumName: 'ai_provider_enum',
    }),
    __metadata("design:type", typeof (_e = typeof ai_provider_enum_1.AiProvider !== "undefined" && ai_provider_enum_1.AiProvider) === "function" ? _e : Object)
], AiGeneration.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], AiGeneration.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ai_generation_status_enum_1.AiGenerationStatus,
        enumName: 'ai_generation_status_enum',
        default: ai_generation_status_enum_1.AiGenerationStatus.PROCESSING,
    }),
    __metadata("design:type", typeof (_f = typeof ai_generation_status_enum_1.AiGenerationStatus !== "undefined" && ai_generation_status_enum_1.AiGenerationStatus) === "function" ? _f : Object)
], AiGeneration.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'applied_results', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "appliedResults", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'input_tokens', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "inputTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'output_tokens', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "outputTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_tokens', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "totalTokens", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'applied_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], AiGeneration.prototype, "appliedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], AiGeneration.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_j = typeof Date !== "undefined" && Date) === "function" ? _j : Object)
], AiGeneration.prototype, "updatedAt", void 0);
exports.AiGeneration = AiGeneration = __decorate([
    (0, typeorm_1.Entity)('ai_generations'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['conversationId']),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['projectId']),
    (0, typeorm_1.Index)(['boardId']),
    (0, typeorm_1.Index)(['sprintId']),
    (0, typeorm_1.Index)(['status'])
], AiGeneration);


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiGenerationStatus = void 0;
var AiGenerationStatus;
(function (AiGenerationStatus) {
    AiGenerationStatus["PROCESSING"] = "PROCESSING";
    AiGenerationStatus["GENERATED"] = "GENERATED";
    AiGenerationStatus["APPLIED"] = "APPLIED";
    AiGenerationStatus["DISCARDED"] = "DISCARDED";
    AiGenerationStatus["FAILED"] = "FAILED";
    AiGenerationStatus["APPLY_BLOCKED"] = "APPLY_BLOCKED";
})(AiGenerationStatus || (exports.AiGenerationStatus = AiGenerationStatus = {}));


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiGenerationType = void 0;
var AiGenerationType;
(function (AiGenerationType) {
    AiGenerationType["WORKSPACE_DRAFT"] = "WORKSPACE_DRAFT";
    AiGenerationType["PROJECT_DRAFT"] = "PROJECT_DRAFT";
    AiGenerationType["TASK_DRAFT"] = "TASK_DRAFT";
    AiGenerationType["WORKSPACE_TREE_DRAFT"] = "WORKSPACE_TREE_DRAFT";
    AiGenerationType["DASHBOARD_INSIGHT"] = "DASHBOARD_INSIGHT";
})(AiGenerationType || (exports.AiGenerationType = AiGenerationType = {}));


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiProvider = void 0;
var AiProvider;
(function (AiProvider) {
    AiProvider["GEMINI"] = "GEMINI";
    AiProvider["OPENAI"] = "OPENAI";
    AiProvider["DEEPSEEK"] = "DEEPSEEK";
})(AiProvider || (exports.AiProvider = AiProvider = {}));


/***/ }),
/* 48 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiMessage = void 0;
const typeorm_1 = __webpack_require__(11);
const ai_message_role_enum_1 = __webpack_require__(49);
const ai_conversation_entity_1 = __webpack_require__(43);
let AiMessage = class AiMessage {
    id;
    conversationId;
    conversation;
    role;
    content;
    context;
    metadata;
    createdAt;
};
exports.AiMessage = AiMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AiMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'conversation_id', type: 'uuid' }),
    __metadata("design:type", String)
], AiMessage.prototype, "conversationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ai_conversation_entity_1.AiConversation, (conversation) => conversation.messages, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'conversation_id' }),
    __metadata("design:type", typeof (_a = typeof ai_conversation_entity_1.AiConversation !== "undefined" && ai_conversation_entity_1.AiConversation) === "function" ? _a : Object)
], AiMessage.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ai_message_role_enum_1.AiMessageRole,
        enumName: 'ai_message_role_enum',
    }),
    __metadata("design:type", typeof (_b = typeof ai_message_role_enum_1.AiMessageRole !== "undefined" && ai_message_role_enum_1.AiMessageRole) === "function" ? _b : Object)
], AiMessage.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AiMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AiMessage.prototype, "context", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AiMessage.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_e = typeof Date !== "undefined" && Date) === "function" ? _e : Object)
], AiMessage.prototype, "createdAt", void 0);
exports.AiMessage = AiMessage = __decorate([
    (0, typeorm_1.Entity)('ai_messages'),
    (0, typeorm_1.Index)(['conversationId']),
    (0, typeorm_1.Index)(['role']),
    (0, typeorm_1.Index)(['createdAt'])
], AiMessage);


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AiMessageRole = void 0;
var AiMessageRole;
(function (AiMessageRole) {
    AiMessageRole["USER"] = "USER";
    AiMessageRole["ASSISTANT"] = "ASSISTANT";
    AiMessageRole["SYSTEM"] = "SYSTEM";
    AiMessageRole["TOOL"] = "TOOL";
})(AiMessageRole || (exports.AiMessageRole = AiMessageRole = {}));


/***/ }),
/* 50 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Attachment = exports.AttachmentStatus = exports.AttachmentProvider = void 0;
const typeorm_1 = __webpack_require__(11);
var AttachmentProvider;
(function (AttachmentProvider) {
    AttachmentProvider["R2"] = "R2";
    AttachmentProvider["CLOUDINARY"] = "CLOUDINARY";
})(AttachmentProvider || (exports.AttachmentProvider = AttachmentProvider = {}));
var AttachmentStatus;
(function (AttachmentStatus) {
    AttachmentStatus["READY"] = "READY";
    AttachmentStatus["FAILED"] = "FAILED";
})(AttachmentStatus || (exports.AttachmentStatus = AttachmentStatus = {}));
let Attachment = class Attachment {
    id;
    workspaceId;
    taskId;
    commentId;
    uploadedBy;
    fileName;
    mimeType;
    size;
    provider;
    storageKey;
    publicId;
    url;
    secureUrl;
    status;
    createdAt;
    updatedAt;
};
exports.Attachment = Attachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Attachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], Attachment.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'task_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Attachment.prototype, "taskId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comment_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Attachment.prototype, "commentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by', type: 'uuid' }),
    __metadata("design:type", String)
], Attachment.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Attachment.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], Attachment.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'bigint',
        transformer: {
            to: (value) => value,
            from: (value) => Number(value),
        },
    }),
    __metadata("design:type", Number)
], Attachment.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AttachmentProvider,
        default: AttachmentProvider.R2,
    }),
    __metadata("design:type", String)
], Attachment.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'storage_key', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Attachment.prototype, "storageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'public_id', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Attachment.prototype, "publicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Attachment.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'secure_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Attachment.prototype, "secureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AttachmentStatus,
        default: AttachmentStatus.READY,
    }),
    __metadata("design:type", String)
], Attachment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Attachment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], Attachment.prototype, "updatedAt", void 0);
exports.Attachment = Attachment = __decorate([
    (0, typeorm_1.Entity)('attachments'),
    (0, typeorm_1.Index)(['workspaceId', 'taskId']),
    (0, typeorm_1.Index)(['workspaceId', 'commentId']),
    (0, typeorm_1.Index)(['storageKey']),
    (0, typeorm_1.Index)(['publicId'])
], Attachment);


/***/ }),
/* 51 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuditLog = exports.AuditLogEntityType = void 0;
const typeorm_1 = __webpack_require__(11);
var AuditLogEntityType;
(function (AuditLogEntityType) {
    AuditLogEntityType["WORKSPACE"] = "WORKSPACE";
    AuditLogEntityType["PROJECT"] = "PROJECT";
    AuditLogEntityType["TASK"] = "TASK";
    AuditLogEntityType["SPRINT"] = "SPRINT";
    AuditLogEntityType["COMMENT"] = "COMMENT";
    AuditLogEntityType["ATTACHMENT"] = "ATTACHMENT";
    AuditLogEntityType["PAGE"] = "PAGE";
    AuditLogEntityType["PAGE_BLOCK"] = "PAGE_BLOCK";
    AuditLogEntityType["USER"] = "USER";
    AuditLogEntityType["ROLE"] = "ROLE";
    AuditLogEntityType["PERMISSION"] = "PERMISSION";
    AuditLogEntityType["BILLING"] = "BILLING";
    AuditLogEntityType["SYSTEM"] = "SYSTEM";
})(AuditLogEntityType || (exports.AuditLogEntityType = AuditLogEntityType = {}));
let AuditLog = class AuditLog {
    id;
    workspaceId;
    actorId;
    action;
    entityType;
    entityId;
    beforeValue;
    afterValue;
    metadata;
    ipAddress;
    userAgent;
    requestId;
    createdAt;
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'entity_type',
        type: 'enum',
        enum: AuditLogEntityType,
        nullable: true,
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'before_value', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "beforeValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'after_value', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "afterValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'request_id', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_logs'),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['actorId']),
    (0, typeorm_1.Index)(['entityType', 'entityId']),
    (0, typeorm_1.Index)(['action']),
    (0, typeorm_1.Index)(['requestId']),
    (0, typeorm_1.Index)(['createdAt'])
], AuditLog);


/***/ }),
/* 52 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BillingWebhook = exports.BillingWebhookStatus = void 0;
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
const invoice_entity_1 = __webpack_require__(53);
const payment_entity_1 = __webpack_require__(54);
const subscription_entity_1 = __webpack_require__(20);
var BillingWebhookStatus;
(function (BillingWebhookStatus) {
    BillingWebhookStatus["RECEIVED"] = "RECEIVED";
    BillingWebhookStatus["PROCESSED"] = "PROCESSED";
    BillingWebhookStatus["FAILED"] = "FAILED";
    BillingWebhookStatus["IGNORED"] = "IGNORED";
})(BillingWebhookStatus || (exports.BillingWebhookStatus = BillingWebhookStatus = {}));
let BillingWebhook = class BillingWebhook {
    id;
    userId;
    user;
    targetWorkspaceId;
    targetWorkspace;
    subscriptionId;
    subscription;
    paymentId;
    payment;
    invoiceId;
    invoice;
    provider;
    providerEventId;
    eventType;
    orderCode;
    providerTransactionId;
    status;
    payload;
    processedAt;
    errorMessage;
    createdAt;
    updatedAt;
};
exports.BillingWebhook = BillingWebhook;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BillingWebhook.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "targetWorkspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'target_workspace_id' }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "targetWorkspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subscription_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subscription_entity_1.Subscription, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_entity_1.Payment, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_id' }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "invoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => invoice_entity_1.Invoice, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'invoice_id' }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "invoice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: subscription_entity_1.BillingProvider,
    }),
    __metadata("design:type", typeof (_f = typeof subscription_entity_1.BillingProvider !== "undefined" && subscription_entity_1.BillingProvider) === "function" ? _f : Object)
], BillingWebhook.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'provider_event_id',
        type: 'varchar',
        length: 255,
    }),
    __metadata("design:type", String)
], BillingWebhook.prototype, "providerEventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], BillingWebhook.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_code', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "orderCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'provider_transaction_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "providerTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BillingWebhookStatus,
        default: BillingWebhookStatus.RECEIVED,
    }),
    __metadata("design:type", String)
], BillingWebhook.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", typeof (_g = typeof Record !== "undefined" && Record) === "function" ? _g : Object)
], BillingWebhook.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "processedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], BillingWebhook.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_j = typeof Date !== "undefined" && Date) === "function" ? _j : Object)
], BillingWebhook.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_k = typeof Date !== "undefined" && Date) === "function" ? _k : Object)
], BillingWebhook.prototype, "updatedAt", void 0);
exports.BillingWebhook = BillingWebhook = __decorate([
    (0, typeorm_1.Entity)('billing_webhooks'),
    (0, typeorm_1.Index)(['provider', 'providerEventId'], { unique: true }),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['targetWorkspaceId']),
    (0, typeorm_1.Index)(['subscriptionId']),
    (0, typeorm_1.Index)(['paymentId']),
    (0, typeorm_1.Index)(['invoiceId']),
    (0, typeorm_1.Index)(['eventType']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['createdAt'])
], BillingWebhook);


/***/ }),
/* 53 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Invoice = exports.InvoiceStatus = void 0;
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
const plan_entity_1 = __webpack_require__(18);
const subscription_entity_1 = __webpack_require__(20);
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["OPEN"] = "OPEN";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["VOID"] = "VOID";
    InvoiceStatus["UNCOLLECTIBLE"] = "UNCOLLECTIBLE";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
let Invoice = class Invoice {
    id;
    userId;
    user;
    planId;
    plan;
    subscriptionId;
    subscription;
    invoiceNumber;
    amountDue;
    amountPaid;
    currency;
    status;
    periodStart;
    periodEnd;
    hostedInvoiceUrl;
    invoicePdfUrl;
    dueAt;
    paidAt;
    metadata;
    createdAt;
    updatedAt;
};
exports.Invoice = Invoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Invoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Invoice.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Invoice.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id', type: 'uuid' }),
    __metadata("design:type", String)
], Invoice.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", typeof (_b = typeof plan_entity_1.Plan !== "undefined" && plan_entity_1.Plan) === "function" ? _b : Object)
], Invoice.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subscription_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subscription_entity_1.Subscription, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", Object)
], Invoice.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'invoice_number',
        type: 'varchar',
        length: 100,
    }),
    __metadata("design:type", String)
], Invoice.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_due', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "amountDue", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount_paid', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Invoice.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'VND' }),
    __metadata("design:type", String)
], Invoice.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.OPEN,
    }),
    __metadata("design:type", String)
], Invoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'period_start', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "periodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'period_end', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "periodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hosted_invoice_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "hostedInvoiceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_pdf_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "invoicePdfUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "dueAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_j = typeof Date !== "undefined" && Date) === "function" ? _j : Object)
], Invoice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_k = typeof Date !== "undefined" && Date) === "function" ? _k : Object)
], Invoice.prototype, "updatedAt", void 0);
exports.Invoice = Invoice = __decorate([
    (0, typeorm_1.Entity)('invoices'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['planId']),
    (0, typeorm_1.Index)(['subscriptionId']),
    (0, typeorm_1.Index)(['invoiceNumber'], { unique: true }),
    (0, typeorm_1.Index)(['status'])
], Invoice);


/***/ }),
/* 54 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Payment = exports.PaymentMethod = exports.PaymentStatus = void 0;
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
const invoice_entity_1 = __webpack_require__(53);
const plan_entity_1 = __webpack_require__(18);
const subscription_entity_1 = __webpack_require__(20);
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["SUCCEEDED"] = "SUCCEEDED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["QR"] = "QR";
    PaymentMethod["ATM"] = "ATM";
    PaymentMethod["VISA"] = "VISA";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["WALLET"] = "WALLET";
    PaymentMethod["UNKNOWN"] = "UNKNOWN";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
let Payment = class Payment {
    id;
    userId;
    user;
    planId;
    plan;
    targetWorkspaceId;
    targetWorkspace;
    subscriptionId;
    subscription;
    invoiceId;
    invoice;
    orderCode;
    provider;
    providerPaymentId;
    providerOrderId;
    providerRequestId;
    providerTransactionId;
    paymentMethod;
    amount;
    currency;
    status;
    paymentUrl;
    expiredAt;
    paidAt;
    failedReason;
    metadata;
    createdAt;
    updatedAt;
};
exports.Payment = Payment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Payment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Payment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], Payment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'plan_id', type: 'uuid' }),
    __metadata("design:type", String)
], Payment.prototype, "planId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_entity_1.Plan, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'plan_id' }),
    __metadata("design:type", typeof (_b = typeof plan_entity_1.Plan !== "undefined" && plan_entity_1.Plan) === "function" ? _b : Object)
], Payment.prototype, "plan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "targetWorkspaceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'target_workspace_id' }),
    __metadata("design:type", Object)
], Payment.prototype, "targetWorkspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'subscription_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "subscriptionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subscription_entity_1.Subscription, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'subscription_id' }),
    __metadata("design:type", Object)
], Payment.prototype, "subscription", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "invoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => invoice_entity_1.Invoice, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'invoice_id' }),
    __metadata("design:type", Object)
], Payment.prototype, "invoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_code', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Payment.prototype, "orderCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: subscription_entity_1.BillingProvider,
        default: subscription_entity_1.BillingProvider.MANUAL,
    }),
    __metadata("design:type", typeof (_f = typeof subscription_entity_1.BillingProvider !== "undefined" && subscription_entity_1.BillingProvider) === "function" ? _f : Object)
], Payment.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'provider_payment_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "providerPaymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'provider_order_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "providerOrderId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'provider_request_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "providerRequestId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'provider_transaction_id',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Payment.prototype, "providerTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'payment_method',
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.UNKNOWN,
    }),
    __metadata("design:type", String)
], Payment.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'amount', type: 'int' }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'VND' }),
    __metadata("design:type", String)
], Payment.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "paymentUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expired_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "expiredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'paid_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "paidAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'failed_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "failedReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_k = typeof Date !== "undefined" && Date) === "function" ? _k : Object)
], Payment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_l = typeof Date !== "undefined" && Date) === "function" ? _l : Object)
], Payment.prototype, "updatedAt", void 0);
exports.Payment = Payment = __decorate([
    (0, typeorm_1.Entity)('payments'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['planId']),
    (0, typeorm_1.Index)(['subscriptionId']),
    (0, typeorm_1.Index)(['invoiceId']),
    (0, typeorm_1.Index)(['targetWorkspaceId']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['orderCode'], { unique: true }),
    (0, typeorm_1.Index)(['provider', 'providerOrderId']),
    (0, typeorm_1.Index)(['provider', 'providerRequestId']),
    (0, typeorm_1.Index)(['provider', 'providerTransactionId'])
], Payment);


/***/ }),
/* 55 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Mention = exports.MentionEntityType = exports.MentionSourceType = void 0;
const typeorm_1 = __webpack_require__(11);
var MentionSourceType;
(function (MentionSourceType) {
    MentionSourceType["TASK_COMMENT"] = "TASK_COMMENT";
    MentionSourceType["PAGE_COMMENT"] = "PAGE_COMMENT";
    MentionSourceType["PAGE_BLOCK"] = "PAGE_BLOCK";
})(MentionSourceType || (exports.MentionSourceType = MentionSourceType = {}));
var MentionEntityType;
(function (MentionEntityType) {
    MentionEntityType["TASK"] = "TASK";
    MentionEntityType["PAGE"] = "PAGE";
    MentionEntityType["PAGE_BLOCK"] = "PAGE_BLOCK";
})(MentionEntityType || (exports.MentionEntityType = MentionEntityType = {}));
let Mention = class Mention {
    id;
    workspaceId;
    projectId;
    mentionerId;
    mentionedUserId;
    sourceType;
    sourceId;
    entityType;
    entityId;
    notificationId;
    createdAt;
};
exports.Mention = Mention;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Mention.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], Mention.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Mention.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mentioner_id', type: 'uuid' }),
    __metadata("design:type", String)
], Mention.prototype, "mentionerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mentioned_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Mention.prototype, "mentionedUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'source_type',
        type: 'enum',
        enum: MentionSourceType,
    }),
    __metadata("design:type", String)
], Mention.prototype, "sourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_id', type: 'uuid' }),
    __metadata("design:type", String)
], Mention.prototype, "sourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'entity_type',
        type: 'enum',
        enum: MentionEntityType,
    }),
    __metadata("design:type", String)
], Mention.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_id', type: 'uuid' }),
    __metadata("design:type", String)
], Mention.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notification_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Mention.prototype, "notificationId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], Mention.prototype, "createdAt", void 0);
exports.Mention = Mention = __decorate([
    (0, typeorm_1.Entity)('mentions'),
    (0, typeorm_1.Index)(['workspaceId', 'mentionedUserId']),
    (0, typeorm_1.Index)(['workspaceId', 'sourceType', 'sourceId']),
    (0, typeorm_1.Index)(['entityType', 'entityId']),
    (0, typeorm_1.Index)(['notificationId'])
], Mention);


/***/ }),
/* 56 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Page = void 0;
const page_block_entity_1 = __webpack_require__(57);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
let Page = class Page {
    id;
    workspace_id;
    workspace;
    title;
    slug;
    icon;
    cover_url;
    is_template;
    created_by;
    creator;
    blocks;
    createdAt;
    updatedAt;
    deletedAt;
    deletedBy;
};
exports.Page = Page;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Page.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Page.prototype, "workspace_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_a = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _a : Object)
], Page.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Page.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Page.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true, type: 'varchar' }),
    __metadata("design:type", Object)
], Page.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cover_url', nullable: true, type: 'text' }),
    __metadata("design:type", Object)
], Page.prototype, "cover_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Page.prototype, "is_template", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'created_by' }),
    __metadata("design:type", String)
], Page.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], Page.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => page_block_entity_1.PageBlock, (block) => block.page),
    __metadata("design:type", Array)
], Page.prototype, "blocks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], Page.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], Page.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Page.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Page.prototype, "deletedBy", void 0);
exports.Page = Page = __decorate([
    (0, typeorm_1.Entity)('pages'),
    (0, typeorm_1.Index)('IDX_PAGES_WORKSPACE_ID', ['workspace_id']),
    (0, typeorm_1.Index)('IDX_PAGES_DELETED_AT', ['deletedAt']),
    (0, typeorm_1.Index)('UQ_PAGES_WORKSPACE_SLUG_ACTIVE', ['workspace_id', 'slug'], {
        unique: true,
        where: '"deleted_at" IS NULL',
    })
], Page);


/***/ }),
/* 57 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PageBlock = exports.PageBlockType = void 0;
const page_entity_1 = __webpack_require__(56);
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
var PageBlockType;
(function (PageBlockType) {
    PageBlockType["TEXT"] = "TEXT";
    PageBlockType["HEADER"] = "HEADER";
    PageBlockType["QUOTE"] = "QUOTE";
    PageBlockType["DIVIDER"] = "DIVIDER";
    PageBlockType["CODE"] = "CODE";
    PageBlockType["TODO"] = "TODO";
    PageBlockType["IMAGE"] = "IMAGE";
    PageBlockType["VIDEO"] = "VIDEO";
    PageBlockType["FILE"] = "FILE";
    PageBlockType["BOOKMARK"] = "BOOKMARK";
    PageBlockType["EMBED"] = "EMBED";
    PageBlockType["FIGMA"] = "FIGMA";
    PageBlockType["GITHUB_GIST"] = "GITHUB_GIST";
    PageBlockType["GOOGLE_MAPS"] = "GOOGLE_MAPS";
    PageBlockType["TWEET"] = "TWEET";
    PageBlockType["DATABASE_VIEW"] = "DATABASE_VIEW";
    PageBlockType["TABLE_SIMPLE"] = "TABLE_SIMPLE";
    PageBlockType["MERMAID"] = "MERMAID";
    PageBlockType["BUTTON"] = "BUTTON";
})(PageBlockType || (exports.PageBlockType = PageBlockType = {}));
let PageBlock = class PageBlock {
    id;
    page_id;
    page;
    type;
    title;
    order_index;
    position_x;
    position_y;
    width;
    height;
    content;
    data_config;
    style_config;
    created_by;
    is_open;
    creator;
    created_at;
    updated_at;
    deleted_at;
    deleted_by;
};
exports.PageBlock = PageBlock;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PageBlock.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], PageBlock.prototype, "page_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => page_entity_1.Page, (page) => page.blocks, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'page_id' }),
    __metadata("design:type", typeof (_a = typeof page_entity_1.Page !== "undefined" && page_entity_1.Page) === "function" ? _a : Object)
], PageBlock.prototype, "page", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PageBlockType,
    }),
    __metadata("design:type", String)
], PageBlock.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], PageBlock.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PageBlock.prototype, "order_index", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PageBlock.prototype, "position_x", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PageBlock.prototype, "position_y", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PageBlock.prototype, "width", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], PageBlock.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", typeof (_b = typeof PageBlockJson !== "undefined" && PageBlockJson) === "function" ? _b : Object)
], PageBlock.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", typeof (_c = typeof PageBlockJson !== "undefined" && PageBlockJson) === "function" ? _c : Object)
], PageBlock.prototype, "data_config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", typeof (_d = typeof PageBlockStyleConfig !== "undefined" && PageBlockStyleConfig) === "function" ? _d : Object)
], PageBlock.prototype, "style_config", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid', { name: 'created_by' }),
    __metadata("design:type", String)
], PageBlock.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PageBlock.prototype, "is_open", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", typeof (_e = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _e : Object)
], PageBlock.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], PageBlock.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp' }),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], PageBlock.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], PageBlock.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'deleted_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PageBlock.prototype, "deleted_by", void 0);
exports.PageBlock = PageBlock = __decorate([
    (0, typeorm_1.Entity)('page_blocks'),
    (0, typeorm_1.Index)('IDX_PAGE_BLOCKS_PAGE_ID', ['page_id']),
    (0, typeorm_1.Index)('IDX_PAGE_BLOCKS_DELETED_AT', ['deleted_at']),
    (0, typeorm_1.Index)('UQ_PAGE_BLOCKS_PAGE_ORDER_ACTIVE', ['page_id', 'order_index'], {
        unique: true,
        where: '"deleted_at" IS NULL',
    })
], PageBlock);


/***/ }),
/* 58 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PageTemplateBlock = void 0;
const typeorm_1 = __webpack_require__(11);
let PageTemplateBlock = class PageTemplateBlock {
    id;
    templateId;
    parentBlockId;
    type;
    content;
    orderIndex;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.PageTemplateBlock = PageTemplateBlock;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PageTemplateBlock.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'template_id', type: 'uuid' }),
    __metadata("design:type", String)
], PageTemplateBlock.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_block_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PageTemplateBlock.prototype, "parentBlockId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PageTemplateBlock.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PageTemplateBlock.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_index', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PageTemplateBlock.prototype, "orderIndex", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], PageTemplateBlock.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], PageTemplateBlock.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], PageTemplateBlock.prototype, "deletedAt", void 0);
exports.PageTemplateBlock = PageTemplateBlock = __decorate([
    (0, typeorm_1.Entity)('page_template_blocks'),
    (0, typeorm_1.Index)(['templateId']),
    (0, typeorm_1.Index)(['templateId', 'orderIndex']),
    (0, typeorm_1.Index)(['parentBlockId'])
], PageTemplateBlock);


/***/ }),
/* 59 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PageTemplate = void 0;
const typeorm_1 = __webpack_require__(11);
const template_enum_1 = __webpack_require__(60);
let PageTemplate = class PageTemplate {
    id;
    workspaceId;
    name;
    description;
    icon;
    coverUrl;
    category;
    isSystem;
    createdBy;
    status;
    visibility;
    useCount;
    likesCount;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.PageTemplate = PageTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PageTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PageTemplate.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PageTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PageTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], PageTemplate.prototype, "icon", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cover_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], PageTemplate.prototype, "coverUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], PageTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_system', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PageTemplate.prototype, "isSystem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], PageTemplate.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: template_enum_1.TemplateStatus,
        default: template_enum_1.TemplateStatus.DRAFT,
    }),
    __metadata("design:type", typeof (_a = typeof template_enum_1.TemplateStatus !== "undefined" && template_enum_1.TemplateStatus) === "function" ? _a : Object)
], PageTemplate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: template_enum_1.TemplateVisibility,
        default: template_enum_1.TemplateVisibility.PRIVATE,
    }),
    __metadata("design:type", typeof (_b = typeof template_enum_1.TemplateVisibility !== "undefined" && template_enum_1.TemplateVisibility) === "function" ? _b : Object)
], PageTemplate.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'use_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PageTemplate.prototype, "useCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], PageTemplate.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], PageTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], PageTemplate.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], PageTemplate.prototype, "deletedAt", void 0);
exports.PageTemplate = PageTemplate = __decorate([
    (0, typeorm_1.Entity)('page_templates'),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['workspaceId', 'name']),
    (0, typeorm_1.Index)(['createdBy']),
    (0, typeorm_1.Index)(['isSystem']),
    (0, typeorm_1.Index)(['status', 'visibility'])
], PageTemplate);


/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TemplateVisibility = exports.TemplateStatus = void 0;
var TemplateStatus;
(function (TemplateStatus) {
    TemplateStatus["DRAFT"] = "DRAFT";
    TemplateStatus["PUBLISHED"] = "PUBLISHED";
    TemplateStatus["ARCHIVED"] = "ARCHIVED";
})(TemplateStatus || (exports.TemplateStatus = TemplateStatus = {}));
var TemplateVisibility;
(function (TemplateVisibility) {
    TemplateVisibility["PRIVATE"] = "PRIVATE";
    TemplateVisibility["WORKSPACE"] = "WORKSPACE";
    TemplateVisibility["PUBLIC"] = "PUBLIC";
    TemplateVisibility["PUBLIC_PENDING"] = "PUBLIC_PENDING";
})(TemplateVisibility || (exports.TemplateVisibility = TemplateVisibility = {}));


/***/ }),
/* 61 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RefreshToken = void 0;
const typeorm_1 = __webpack_require__(11);
const user_entity_1 = __webpack_require__(9);
let RefreshToken = class RefreshToken {
    id;
    user_id;
    user;
    token;
    user_agent;
    ip_address;
    expires_at;
    revoked_at;
    created_at;
};
exports.RefreshToken = RefreshToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RefreshToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], RefreshToken.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_a = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _a : Object)
], RefreshToken.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512 }),
    __metadata("design:type", String)
], RefreshToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'inet', nullable: true }),
    __metadata("design:type", String)
], RefreshToken.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)
], RefreshToken.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], RefreshToken.prototype, "revoked_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], RefreshToken.prototype, "created_at", void 0);
exports.RefreshToken = RefreshToken = __decorate([
    (0, typeorm_1.Entity)('refresh_tokens'),
    (0, typeorm_1.Index)('idx_refresh_token_token', ['token']),
    (0, typeorm_1.Index)('idx_refresh_token_user', ['user_id'])
], RefreshToken);


/***/ }),
/* 62 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SprintReport = void 0;
const project_entity_1 = __webpack_require__(7);
const workspace_entity_1 = __webpack_require__(6);
const sprint_entity_1 = __webpack_require__(12);
const typeorm_1 = __webpack_require__(11);
let SprintReport = class SprintReport {
    id;
    workspaceId;
    projectId;
    sprintId;
    sprintName;
    sprintGoal;
    totalTasks;
    completedTasks;
    incompleteTasks;
    totalEstimate;
    completedEstimate;
    completedTaskIds;
    incompleteTaskIds;
    memberPerformance;
    completedTaskDetails;
    incompleteTaskDetails;
    startAt;
    completedAt;
    workspace;
    project;
    sprint;
    createdAt;
    updatedAt;
};
exports.SprintReport = SprintReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SprintReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid' }),
    __metadata("design:type", String)
], SprintReport.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id', type: 'uuid' }),
    __metadata("design:type", String)
], SprintReport.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sprint_id', type: 'uuid' }),
    __metadata("design:type", String)
], SprintReport.prototype, "sprintId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sprint_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SprintReport.prototype, "sprintName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sprint_goal', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], SprintReport.prototype, "sprintGoal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_tasks', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SprintReport.prototype, "totalTasks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_tasks', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SprintReport.prototype, "completedTasks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'incomplete_tasks', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SprintReport.prototype, "incompleteTasks", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_estimate', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SprintReport.prototype, "totalEstimate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_estimate', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SprintReport.prototype, "completedEstimate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_task_ids', type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], SprintReport.prototype, "completedTaskIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'incomplete_task_ids', type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], SprintReport.prototype, "incompleteTaskIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'member_performance', type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], SprintReport.prototype, "memberPerformance", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_task_details', type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], SprintReport.prototype, "completedTaskDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'incomplete_task_details', type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], SprintReport.prototype, "incompleteTaskDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SprintReport.prototype, "startAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], SprintReport.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_c = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _c : Object)
], SprintReport.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", typeof (_d = typeof project_entity_1.Project !== "undefined" && project_entity_1.Project) === "function" ? _d : Object)
], SprintReport.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sprint_entity_1.Sprint, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'sprint_id' }),
    __metadata("design:type", typeof (_e = typeof sprint_entity_1.Sprint !== "undefined" && sprint_entity_1.Sprint) === "function" ? _e : Object)
], SprintReport.prototype, "sprint", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], SprintReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], SprintReport.prototype, "updatedAt", void 0);
exports.SprintReport = SprintReport = __decorate([
    (0, typeorm_1.Entity)('sprint_reports'),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['projectId']),
    (0, typeorm_1.Index)(['sprintId']),
    (0, typeorm_1.Index)('UQ_SPRINT_REPORTS_SPRINT_ID', ['sprintId'], { unique: true })
], SprintReport);


/***/ }),
/* 63 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserActivity = exports.UserActivityType = void 0;
const user_entity_1 = __webpack_require__(9);
const typeorm_1 = __webpack_require__(11);
var UserActivityType;
(function (UserActivityType) {
    UserActivityType["LOGIN"] = "LOGIN";
    UserActivityType["OPEN_APP"] = "OPEN_APP";
    UserActivityType["OPEN_WORKSPACE"] = "OPEN_WORKSPACE";
    UserActivityType["REFRESH_TOKEN"] = "REFRESH_TOKEN";
})(UserActivityType || (exports.UserActivityType = UserActivityType = {}));
let UserActivity = class UserActivity {
    id;
    userId;
    type;
    createdAt;
    user;
};
exports.UserActivity = UserActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], UserActivity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserActivityType,
        enumName: 'user_activity_type_enum',
        default: UserActivityType.OPEN_APP,
    }),
    __metadata("design:type", String)
], UserActivity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)
], UserActivity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", typeof (_b = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _b : Object)
], UserActivity.prototype, "user", void 0);
exports.UserActivity = UserActivity = __decorate([
    (0, typeorm_1.Entity)('user_activities'),
    (0, typeorm_1.Index)('IDX_user_activities_user_id', ['userId']),
    (0, typeorm_1.Index)('IDX_user_activities_created_at', ['createdAt'])
], UserActivity);


/***/ }),
/* 64 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkspaceInvite = exports.WorkspaceInviteType = exports.WorkspaceInviteStatus = void 0;
const role_entity_1 = __webpack_require__(28);
const user_entity_1 = __webpack_require__(9);
const workspace_entity_1 = __webpack_require__(6);
const typeorm_1 = __webpack_require__(11);
var WorkspaceInviteStatus;
(function (WorkspaceInviteStatus) {
    WorkspaceInviteStatus["PENDING"] = "PENDING";
    WorkspaceInviteStatus["ACCEPTED"] = "ACCEPTED";
    WorkspaceInviteStatus["EXPIRED"] = "EXPIRED";
    WorkspaceInviteStatus["REVOKED"] = "REVOKED";
})(WorkspaceInviteStatus || (exports.WorkspaceInviteStatus = WorkspaceInviteStatus = {}));
var WorkspaceInviteType;
(function (WorkspaceInviteType) {
    WorkspaceInviteType["EMAIL"] = "EMAIL";
    WorkspaceInviteType["LINK"] = "LINK";
})(WorkspaceInviteType || (exports.WorkspaceInviteType = WorkspaceInviteType = {}));
let WorkspaceInvite = class WorkspaceInvite {
    id;
    workspace_id;
    workspace;
    user_id;
    user;
    email;
    type;
    role_name;
    invited_by;
    inviter;
    token;
    status;
    accepted_at;
    expires_at;
    max_uses;
    used_count;
    created_at;
    updated_at;
};
exports.WorkspaceInvite = WorkspaceInvite;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkspaceInvite.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkspaceInvite.prototype, "workspace_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => workspace_entity_1.Workspace, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'workspace_id' }),
    __metadata("design:type", typeof (_a = typeof workspace_entity_1.Workspace !== "undefined" && workspace_entity_1.Workspace) === "function" ? _a : Object)
], WorkspaceInvite.prototype, "workspace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvite.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], WorkspaceInvite.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvite.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkspaceInviteType,
        default: WorkspaceInviteType.EMAIL,
    }),
    __metadata("design:type", String)
], WorkspaceInvite.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: role_entity_1.RoleName, default: role_entity_1.RoleName.MEMBER }),
    __metadata("design:type", typeof (_c = typeof role_entity_1.RoleName !== "undefined" && role_entity_1.RoleName) === "function" ? _c : Object)
], WorkspaceInvite.prototype, "role_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], WorkspaceInvite.prototype, "invited_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'invited_by' }),
    __metadata("design:type", typeof (_d = typeof user_entity_1.User !== "undefined" && user_entity_1.User) === "function" ? _d : Object)
], WorkspaceInvite.prototype, "inviter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], WorkspaceInvite.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WorkspaceInviteStatus,
        default: WorkspaceInviteStatus.PENDING,
    }),
    __metadata("design:type", String)
], WorkspaceInvite.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvite.prototype, "accepted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_f = typeof Date !== "undefined" && Date) === "function" ? _f : Object)
], WorkspaceInvite.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceInvite.prototype, "max_uses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkspaceInvite.prototype, "used_count", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_g = typeof Date !== "undefined" && Date) === "function" ? _g : Object)
], WorkspaceInvite.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", typeof (_h = typeof Date !== "undefined" && Date) === "function" ? _h : Object)
], WorkspaceInvite.prototype, "updated_at", void 0);
exports.WorkspaceInvite = WorkspaceInvite = __decorate([
    (0, typeorm_1.Entity)('workspace_invites'),
    (0, typeorm_1.Index)('UQ_workspace_invites_token', ['token'], { unique: true }),
    (0, typeorm_1.Index)('IDX_workspace_invites_workspace_id', ['workspace_id']),
    (0, typeorm_1.Index)('IDX_workspace_invites_email', ['email']),
    (0, typeorm_1.Index)('IDX_workspace_invites_status', ['status']),
    (0, typeorm_1.Index)('IDX_workspace_invites_invited_by', ['invited_by']),
    (0, typeorm_1.Index)('IDX_workspace_invites_user_id', ['user_id']),
    (0, typeorm_1.Index)('IDX_workspace_invites_type', ['type'])
], WorkspaceInvite);


/***/ }),
/* 65 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkspaceTemplate = void 0;
const typeorm_1 = __webpack_require__(11);
const template_enum_1 = __webpack_require__(60);
let WorkspaceTemplate = class WorkspaceTemplate {
    id;
    name;
    description;
    category;
    coverUrl;
    config;
    isSystem;
    pageTemplateId;
    status;
    visibility;
    createdBy;
    workspaceId;
    useCount;
    likesCount;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.WorkspaceTemplate = WorkspaceTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WorkspaceTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], WorkspaceTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cover_url', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "coverUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_system', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], WorkspaceTemplate.prototype, "isSystem", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'page_template_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "pageTemplateId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: template_enum_1.TemplateStatus,
        default: template_enum_1.TemplateStatus.DRAFT,
    }),
    __metadata("design:type", typeof (_a = typeof template_enum_1.TemplateStatus !== "undefined" && template_enum_1.TemplateStatus) === "function" ? _a : Object)
], WorkspaceTemplate.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: template_enum_1.TemplateVisibility,
        default: template_enum_1.TemplateVisibility.PRIVATE,
    }),
    __metadata("design:type", typeof (_b = typeof template_enum_1.TemplateVisibility !== "undefined" && template_enum_1.TemplateVisibility) === "function" ? _b : Object)
], WorkspaceTemplate.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'workspace_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "workspaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'use_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkspaceTemplate.prototype, "useCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'likes_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WorkspaceTemplate.prototype, "likesCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", typeof (_c = typeof Date !== "undefined" && Date) === "function" ? _c : Object)
], WorkspaceTemplate.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)
], WorkspaceTemplate.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Object)
], WorkspaceTemplate.prototype, "deletedAt", void 0);
exports.WorkspaceTemplate = WorkspaceTemplate = __decorate([
    (0, typeorm_1.Entity)('workspace_templates'),
    (0, typeorm_1.Index)(['workspaceId']),
    (0, typeorm_1.Index)(['createdBy']),
    (0, typeorm_1.Index)(['isSystem']),
    (0, typeorm_1.Index)(['status', 'visibility'])
], WorkspaceTemplate);


/***/ }),
/* 66 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEMO_SEED_CONFIG = void 0;
const demo_seed_constants_1 = __webpack_require__(67);
exports.DEMO_SEED_CONFIG = {
    version: demo_seed_constants_1.DEMO_SEED_KEY,
    fakerSeed: 2026,
    userCount: 50,
    workspaceCount: 20,
    largeWorkspaceCount: 3,
    mediumWorkspaceCount: 7,
    proWorkspaceCount: 0,
    mainDemoWorkspaceCount: 9,
    targetProjectCount: 51,
    targetSprintCount: 92,
    targetTaskCount: 580,
    targetCommentCount: 120,
    batchSize: 200,
};


/***/ }),
/* 67 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEMO_SEED_EMAIL_DOMAIN = exports.DEMO_SEED_SLUG_PREFIX = exports.DEMO_SEED_MARKER = exports.DEMO_SEED_KEY = void 0;
exports.DEMO_SEED_KEY = 'TASK_MANAGEMENT_DEMO_V1';
exports.DEMO_SEED_MARKER = `[${exports.DEMO_SEED_KEY}]`;
exports.DEMO_SEED_SLUG_PREFIX = 'demo-v1';
exports.DEMO_SEED_EMAIL_DOMAIN = 'example.com';


/***/ }),
/* 68 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createDemoSeedReport = createDemoSeedReport;
exports.addReport = addReport;
exports.mergeDemoSeedReport = mergeDemoSeedReport;
exports.chunkArray = chunkArray;
exports.padNumber = padNumber;
exports.demoMarker = demoMarker;
exports.demoSeedId = demoSeedId;
exports.addDays = addDays;
exports.seededPosition = seededPosition;
exports.assertDemoSeedSafety = assertDemoSeedSafety;
exports.printDemoSeedReport = printDemoSeedReport;
const decimal_js_1 = __importDefault(__webpack_require__(69));
const task_position_util_1 = __webpack_require__(70);
const demo_seed_config_1 = __webpack_require__(66);
const demo_seed_constants_1 = __webpack_require__(67);
const TABLES = [
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
function createDemoSeedReport() {
    return TABLES.reduce((report, table) => {
        report[table] = {
            created: 0,
            existing: 0,
            skipped: 0,
            failed: 0,
            reasons: [],
        };
        return report;
    }, {});
}
function addReport(report, table, patch) {
    const counter = report[table];
    counter.created += patch.created ?? 0;
    counter.existing += patch.existing ?? 0;
    counter.skipped += patch.skipped ?? 0;
    counter.failed += patch.failed ?? 0;
    if (patch.reason && !counter.reasons.includes(patch.reason)) {
        counter.reasons.push(patch.reason);
    }
}
function mergeDemoSeedReport(target, source) {
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
function chunkArray(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}
function padNumber(value, length = 3) {
    return value.toString().padStart(length, '0');
}
function demoMarker(...parts) {
    return `${demo_seed_constants_1.DEMO_SEED_MARKER}${parts.map((part) => `[${part}]`).join('')}`;
}
function demoSeedId(...parts) {
    return parts.map((part) => String(part)).join(':');
}
function addDays(base, days) {
    return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}
function seededPosition(index) {
    return new decimal_js_1.default(index + 1).mul(task_position_util_1.POSITION_STEP).toFixed(task_position_util_1.POSITION_SCALE);
}
function assertDemoSeedSafety() {
    if (process.env.ALLOW_DEMO_SEED !== 'true') {
        throw new Error('Demo seed is disabled.');
    }
    if (process.env.NODE_ENV === 'production' &&
        process.env.DEMO_SEED_CONFIRM !== 'I_UNDERSTAND') {
        throw new Error('Production demo seed requires DEMO_SEED_CONFIRM=I_UNDERSTAND.');
    }
    if (process.env.DEMO_SEED_VERSION !== demo_seed_config_1.DEMO_SEED_CONFIG.version) {
        throw new Error(`DEMO_SEED_VERSION must be ${demo_seed_config_1.DEMO_SEED_CONFIG.version}.`);
    }
    if (process.env.DB_SYNCHRONIZE === 'true') {
        throw new Error('Demo seed refuses to run with DB_SYNCHRONIZE=true.');
    }
}
function printDemoSeedReport(report) {
    const totals = Object.values(report).reduce((sum, counter) => ({
        created: sum.created + counter.created,
        existing: sum.existing + counter.existing,
        skipped: sum.skipped + counter.skipped,
        failed: sum.failed + counter.failed,
    }), { created: 0, existing: 0, skipped: 0, failed: 0 });
    console.log('');
    console.log(totals.failed > 0
        ? 'Demo seed completed with failures'
        : 'Demo seed completed successfully');
    console.log('');
    console.log(`Seed version: ${demo_seed_constants_1.DEMO_SEED_KEY}`);
    console.log('Transaction strategy: per workspace');
    console.log('');
    for (const table of TABLES) {
        const counter = report[table];
        console.log(`${table.padEnd(25)} ${String(counter.created).padStart(5)} created, ${String(counter.existing).padStart(5)} existing, ${String(counter.skipped).padStart(5)} skipped, ${String(counter.failed).padStart(5)} failed`);
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


/***/ }),
/* 69 */
/***/ ((module) => {

module.exports = require("decimal.js");

/***/ }),
/* 70 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.POSITION_SCALE = exports.POSITION_STEP = void 0;
exports.calculatePosition = calculatePosition;
exports.hasEnoughPositionGap = hasEnoughPositionGap;
const decimal_js_1 = __importDefault(__webpack_require__(69));
exports.POSITION_STEP = new decimal_js_1.default(1000);
exports.POSITION_SCALE = 15;
function calculatePosition(params) {
    const { previousPosition, nextPosition } = params;
    if (!previousPosition && !nextPosition) {
        return exports.POSITION_STEP.toFixed(exports.POSITION_SCALE);
    }
    if (!previousPosition && nextPosition) {
        return new decimal_js_1.default(nextPosition)
            .minus(exports.POSITION_STEP)
            .toFixed(exports.POSITION_SCALE);
    }
    if (previousPosition && !nextPosition) {
        return new decimal_js_1.default(previousPosition)
            .plus(exports.POSITION_STEP)
            .toFixed(exports.POSITION_SCALE);
    }
    return new decimal_js_1.default(previousPosition)
        .plus(nextPosition)
        .dividedBy(2)
        .toFixed(exports.POSITION_SCALE);
}
function hasEnoughPositionGap(params) {
    const gap = new decimal_js_1.default(params.nextPosition).minus(params.previousPosition);
    const minimumGap = new decimal_js_1.default(1).dividedBy(new decimal_js_1.default(10).pow(exports.POSITION_SCALE));
    return gap.greaterThan(minimumGap);
}


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;