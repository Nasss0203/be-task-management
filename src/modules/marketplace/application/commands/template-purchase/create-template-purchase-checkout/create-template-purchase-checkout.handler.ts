import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { PAYMENT_TYPES } from 'src/modules/payment/payment.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

import type {
  StripeCheckoutPort,
  StripeCheckoutResult,
} from 'src/modules/payment/application/ports/stripe-checkout.port';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import {
  TemplatePurchaseProvider,
  TemplatePurchaseStatus,
} from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';

import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';
import type { TemplateContentPort } from 'src/modules/template/application/ports/template-content.port';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { TemplatePurchaseEligibilityService } from '../../../services/template-purchase-eligibility.service';

import { CreateTemplatePurchaseCheckoutCommand } from './create-template-purchase-checkout.command';

const STRIPE_MIN_REMAINING_MS = 31 * 60 * 1000;

@Injectable()
export class CreateTemplatePurchaseCheckoutHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplatePurchaseRepository)
    private readonly purchaseRepository: TemplatePurchaseRepository,

    @Inject(PAYMENT_TYPES.providers.StripeCheckoutService)
    private readonly stripeCheckoutPort: StripeCheckoutPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templateRepository: TemplateContentPort,

    @Inject(MARKETPLACE_TYPES.services.TemplatePurchaseEligibilityService)
    private readonly eligibility: TemplatePurchaseEligibilityService,
  ) {}

  async execute(
    command: CreateTemplatePurchaseCheckoutCommand,
  ): Promise<StripeCheckoutResult> {
    if (command.provider !== TemplatePurchaseProvider.STRIPE) {
      throw new BadRequestException('Payment provider is not supported yet');
    }

    const purchase = await this.unitOfWork.runInTransaction(async (context) => {
      const existingPurchase = await this.purchaseRepository.findByIdForUpdate(
        command.purchaseId,
        context,
      );

      if (
        !existingPurchase ||
        existingPurchase.getBuyerId() !== command.buyerId
      ) {
        throw new NotFoundException('Template purchase not found');
      }

      if (existingPurchase.getStatus() !== TemplatePurchaseStatus.PENDING) {
        throw new ConflictException('Template purchase is not pending');
      }

      // Recheck: ownership or a reconciliation may have appeared since this
      // purchase was created, and no new Stripe session may be opened then.
      const template = await this.templateRepository.findById(
        existingPurchase.getTemplateId(),
        context,
      );

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      await this.eligibility.assertCanPurchase(
        {
          templateId: template.getId(),
          templateCreatorId: template.getCreatedBy(),
          buyerId: command.buyerId,
        },
        context,
      );

      const remainingMs =
        existingPurchase.getExpiresAt().getTime() - Date.now();

      // Stripe Checkout requires at least 30 minutes.
      // Keep a small buffer for request processing.
      if (remainingMs < STRIPE_MIN_REMAINING_MS) {
        throw new ConflictException(
          'Insufficient time remaining for Stripe checkout',
        );
      }

      const selectedProvider = existingPurchase.getProvider();

      if (selectedProvider !== null && selectedProvider !== command.provider) {
        throw new ConflictException(
          'Template purchase already uses another payment provider',
        );
      }

      if (selectedProvider === null) {
        existingPurchase.selectProvider(command.provider);

        await this.purchaseRepository.save(existingPurchase, context);
      }

      return existingPurchase;
    });

    // External API call happens AFTER transaction commit.
    return this.stripeCheckoutPort.createMarketplaceCheckout({
      purchaseId: purchase.getId(),
      templateId: purchase.getTemplateId(),
      orderCode: purchase.getOrderCode(),
      amount: purchase.getAmount(),
      currency: 'VND',
      expiresAt: purchase.getExpiresAt(),
    });
  }
}
