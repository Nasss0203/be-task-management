import { TemplateEntitlement } from '../../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import { TemplateEntitlementSource } from '../../../domain/enums/template-entitlement-source.enum';

export class TemplateEntitlementResponseDto {
  id: string;
  template_id: string;
  user_id: string;
  source: TemplateEntitlementSource;
  created_at: Date;

  static fromDomain(
    entitlement: TemplateEntitlement,
  ): TemplateEntitlementResponseDto {
    const dto = new TemplateEntitlementResponseDto();

    dto.id = entitlement.getId();
    dto.template_id = entitlement.getTemplateId();
    dto.user_id = entitlement.getUserId();
    dto.source = entitlement.getSource();
    dto.created_at = entitlement.getCreatedAt();

    return dto;
  }
}
