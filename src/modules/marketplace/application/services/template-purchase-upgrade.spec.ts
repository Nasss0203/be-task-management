import { ConflictException, ForbiddenException } from '@nestjs/common';

import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import {
  ResolveTemplatePurchaseReconciliationCommand,
  TemplatePurchaseReconciliationResolution,
} from '../commands/template-purchase/resolve-template-purchase-reconciliation/resolve-template-purchase-reconciliation.command';
import { ResolveTemplatePurchaseReconciliationHandler } from '../commands/template-purchase/resolve-template-purchase-reconciliation/resolve-template-purchase-reconciliation.handler';
import { TemplateEntitlement } from '../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import {
  TemplatePurchase,
  TemplatePurchaseProvider,
  TemplatePurchaseStatus,
} from '../../domain/aggregates/template-purchase/template-purchase.aggregate';
import { TemplateEntitlementSource } from '../../domain/enums/template-entitlement-source.enum';
import type { TemplateEntitlementRepository } from '../../domain/repositories/template-entitlement.repository';
import type { TemplatePurchaseRepository } from '../../domain/repositories/template-purchase.repository';
import { TemplatePurchaseEligibilityService } from './template-purchase-eligibility.service';
import { TemplatePurchaseSettlementService } from './template-purchase-settlement.service';

// Regression for E2E H1 (FREE_CLAIM -> PAID_PURCHASE), M4 (creator) and
// M5 (reconciliation) — see docs/e2e/phase-7-marketplace-e2e-report.md.

const TEMPLATE = 'template-1';
const BUYER = 'buyer-1';
const CREATOR = 'creator-1';

/** In-memory entitlement store with the same one-row-per-user rule. */
function entitlementStore(initial: TemplateEntitlement[] = []) {
  const rows = new Map(initial.map((row) => [row.getId(), row]));
  const repo = {
    findByTemplateAndUser: jest.fn(async (templateId: string, userId: string) =>
      [...rows.values()].find(
        (row) => row.getTemplateId() === templateId && row.getUserId() === userId,
      ) ?? null,
    ),
    create: jest.fn(async (row: TemplateEntitlement) => {
      rows.set(row.getId(), row);
      return row;
    }),
    upgradeFreeClaimToPaidPurchase: jest.fn(async (id: string) => {
      const row = rows.get(id);
      if (row?.getSource() !== TemplateEntitlementSource.FREE_CLAIM) {
        return false;
      }
      rows.set(
        id,
        TemplateEntitlement.restore({
          id,
          templateId: row.getTemplateId(),
          userId: row.getUserId(),
          source: TemplateEntitlementSource.PAID_PURCHASE,
          createdAt: row.getCreatedAt(),
        }),
      );
      return true;
    }),
  };
  return { rows, repo: repo as unknown as TemplateEntitlementRepository & typeof repo };
}

function freeClaim(createdAt = new Date('2026-01-01T00:00:00Z')) {
  return TemplateEntitlement.create({
    id: 'free-claim-1',
    templateId: TEMPLATE,
    userId: BUYER,
    source: TemplateEntitlementSource.FREE_CLAIM,
    createdAt,
  });
}

function paidPurchaseRow() {
  return TemplateEntitlement.create({
    id: 'paid-1',
    templateId: TEMPLATE,
    userId: BUYER,
    source: TemplateEntitlementSource.PAID_PURCHASE,
  });
}

function pendingPurchase() {
  const purchase = TemplatePurchase.create({
    templateId: TEMPLATE,
    listingId: 'listing-1',
    buyerId: BUYER,
    publishedVersionId: 'version-2',
    amount: 50000,
    currency: 'VND',
    commissionRateBps: 0,
    idempotencyKey: 'key-1',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  purchase.selectProvider(TemplatePurchaseProvider.STRIPE);
  return purchase;
}

function purchaseStore(purchase: TemplatePurchase, inReconciliation = false) {
  return {
    findById: jest.fn(async () => purchase),
    findByIdForUpdate: jest.fn(async () => purchase),
    findByOrderCodeForUpdate: jest.fn(async () => purchase),
    save: jest.fn(async (saved: TemplatePurchase) => saved),
    existsByBuyerTemplateAndStatus: jest.fn(async () => inReconciliation),
  } as unknown as TemplatePurchaseRepository;
}

const templates = {
  findByIdForUpdate: jest.fn(async () => ({ getId: () => TEMPLATE })),
} as unknown as TemplateContentPort;

describe('TemplatePurchaseEligibilityService', () => {
  const eligibility = (
    rows: TemplateEntitlement[] = [],
    inReconciliation = false,
  ) =>
    new TemplatePurchaseEligibilityService(
      entitlementStore(rows).repo,
      purchaseStore(pendingPurchase(), inReconciliation),
    );
  const input = { templateId: TEMPLATE, templateCreatorId: CREATOR, buyerId: BUYER };

  it('lets a FREE_CLAIM owner buy the paid release', async () => {
    await expect(eligibility([freeClaim()]).assertCanPurchase(input)).resolves.toBeUndefined();
  });

  it('rejects the creator buying their own template', async () => {
    await expect(
      eligibility().assertCanPurchase({ ...input, buyerId: CREATOR }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a buyer who already has PAID_PURCHASE', async () => {
    await expect(
      eligibility([paidPurchaseRow()]).assertCanPurchase(input),
    ).rejects.toThrow('User already owns this template');
  });

  it('rejects while a previous payment awaits reconciliation', async () => {
    await expect(eligibility([], true).assertCanPurchase(input)).rejects.toThrow(
      'A previous payment for this template is being reconciled',
    );
  });
});

describe('TemplatePurchaseSettlementService entitlement', () => {
  const settle = async (rows: TemplateEntitlement[]) => {
    const purchase = pendingPurchase();
    const entitlements = entitlementStore(rows);
    const service = new TemplatePurchaseSettlementService(
      purchaseStore(purchase),
      entitlements.repo,
      templates,
    );
    const result = await service.settle({
      purchaseId: purchase.getId(),
      templateId: TEMPLATE,
      orderCode: purchase.getOrderCode(),
      provider: TemplatePurchaseProvider.STRIPE,
      amount: 50000,
      currency: 'vnd',
      paidAt: new Date(),
      processedAt: new Date(),
      context: {} as never,
    });
    return { result, purchase, entitlements };
  };

  it('upgrades a FREE_CLAIM in place and keeps its creation time', async () => {
    const claim = freeClaim();
    const { result, purchase, entitlements } = await settle([claim]);

    expect(result).toBe('PROCESSED');
    expect(purchase.getStatus()).toBe(TemplatePurchaseStatus.PAID);
    expect(purchase.getEntitlementId()).toBe(claim.getId());
    expect(entitlements.rows.size).toBe(1);
    const row = entitlements.rows.get(claim.getId())!;
    expect(row.getSource()).toBe(TemplateEntitlementSource.PAID_PURCHASE);
    expect(row.getCreatedAt()).toEqual(claim.getCreatedAt());
    expect(entitlements.repo.create).not.toHaveBeenCalled();
  });

  it('creates PAID_PURCHASE for a buyer without any entitlement', async () => {
    const { result, entitlements } = await settle([]);

    expect(result).toBe('PROCESSED');
    expect([...entitlements.rows.values()].map((row) => row.getSource())).toEqual([
      TemplateEntitlementSource.PAID_PURCHASE,
    ]);
  });

  it('moves a second paid purchase to reconciliation without a new row', async () => {
    const { result, purchase, entitlements } = await settle([paidPurchaseRow()]);

    expect(result).toBe('RECONCILIATION_REQUIRED');
    expect(purchase.getStatus()).toBe(TemplatePurchaseStatus.RECONCILIATION_REQUIRED);
    expect(entitlements.rows.size).toBe(1);
  });
});

describe('ResolveTemplatePurchaseReconciliationHandler', () => {
  const unitOfWork = {
    runInTransaction: (work: (context: unknown) => unknown) => work({}),
  } as unknown as UnitOfWork;

  const resolve = async (
    resolution: TemplatePurchaseReconciliationResolution,
    rows: TemplateEntitlement[] = [],
    reconcile = true,
  ) => {
    const purchase = pendingPurchase();
    if (reconcile) purchase.requireReconciliation();
    const entitlements = entitlementStore(rows);
    const handler = new ResolveTemplatePurchaseReconciliationHandler(
      purchaseStore(purchase),
      entitlements.repo,
      templates,
      unitOfWork,
    );
    const result = await handler.execute(
      new ResolveTemplatePurchaseReconciliationCommand(
        purchase.getId(),
        resolution,
        'admin-1',
      ),
    );
    return { result, entitlements };
  };

  it('REFUND closes the purchase without granting anything', async () => {
    const { result, entitlements } = await resolve(
      TemplatePurchaseReconciliationResolution.REFUND,
    );

    expect(result.status).toBe(TemplatePurchaseStatus.REFUNDED);
    expect(entitlements.rows.size).toBe(0);
  });

  it('GRANT upgrades an existing FREE_CLAIM', async () => {
    const { result, entitlements } = await resolve(
      TemplatePurchaseReconciliationResolution.GRANT,
      [freeClaim()],
    );

    expect(result).toMatchObject({
      status: TemplatePurchaseStatus.PAID,
      entitlementId: 'free-claim-1',
    });
    expect(entitlements.rows.get('free-claim-1')?.getSource()).toBe(
      TemplateEntitlementSource.PAID_PURCHASE,
    );
  });

  it('GRANT refuses when the buyer already has PAID_PURCHASE', async () => {
    await expect(
      resolve(TemplatePurchaseReconciliationResolution.GRANT, [paidPurchaseRow()]),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses purchases that are not awaiting reconciliation', async () => {
    await expect(
      resolve(TemplatePurchaseReconciliationResolution.REFUND, [], false),
    ).rejects.toThrow('not awaiting reconciliation');
  });
});
