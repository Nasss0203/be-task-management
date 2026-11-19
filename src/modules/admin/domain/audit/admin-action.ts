export const ADMIN_ACTIONS = [
  'USER_STATUS_CHANGED',
  'USER_ROLE_CHANGED',
  'BILLING_PLAN_UPDATED',
  'BILLING_PRICE_VERSION_CREATED',
  'TEMPLATE_CATEGORY_CREATED',
  'TEMPLATE_CATEGORY_UPDATED',
  'TEMPLATE_CATEGORY_STATUS_CHANGED',
  'MARKETPLACE_COMMISSION_UPDATED',
  'TEMPLATE_PURCHASE_RECONCILED',
  'PUBLISHED_SITE_DISABLED',
  'PUBLISHED_SITE_RESTORED',
] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export const ADMIN_ACTION_TARGET_TYPES = [
  'USER',
  'BILLING_PLAN',
  'TEMPLATE_CATEGORY',
  'MARKETPLACE_COMMISSION',
  'TEMPLATE_PURCHASE',
  'PUBLISHED_SITE',
] as const;

export type AdminActionTargetType = (typeof ADMIN_ACTION_TARGET_TYPES)[number];

export type AdminActionChanges = Record<string, unknown>;

export interface AdminActionActor {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AdminActionEntry {
  actor: AdminActionActor;
  action: AdminAction;
  targetType: AdminActionTargetType;
  targetId: string | null;
  changes: AdminActionChanges;
}

export type AdminRequestClient = Pick<
  AdminActionActor,
  'ipAddress' | 'userAgent'
>;
