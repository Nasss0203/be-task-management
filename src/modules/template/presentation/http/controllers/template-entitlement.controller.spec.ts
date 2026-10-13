/* eslint-disable @typescript-eslint/unbound-method */
import type { IAuth } from 'src/types/auth';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { TemplateEntitlementSource } from '../../../../marketplace/domain/enums/template-entitlement-source.enum';
import { ClaimFreeTemplateCommand } from '../../../../marketplace/application/commands/template-entitlement/claim-free-template/claim-free-template.command';
import type { ClaimFreeTemplateHandler } from '../../../../marketplace/application/commands/template-entitlement/claim-free-template/claim-free-template.handler';
import { TemplateEntitlementResponseDto } from '../../../../marketplace/application/dto/template-entitlement/template-entitlement.response.dto';
import { TemplateEntitlementController } from '../../../../marketplace/presentation/http/controllers/template-entitlement.controller';

describe('TemplateEntitlementController Regression Tests', () => {
  let controller: TemplateEntitlementController;
  let claimFreeTemplateHandler: jest.Mocked<ClaimFreeTemplateHandler>;

  beforeEach(() => {
    claimFreeTemplateHandler = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ClaimFreeTemplateHandler>;

    controller = new TemplateEntitlementController(claimFreeTemplateHandler);
  });

  it('delegates claim to ClaimFreeTemplateHandler with templateId and authenticated userId', async () => {
    const templateId = 'template-uuid-1';
    const auth: IAuth = {
      id: 'user-uuid-1',
      username: 'testuser',
      email: 'user@example.com',
      systemRole: SystemRole.USER,
    };

    const expectedResponse: TemplateEntitlementResponseDto = {
      id: 'entitlement-uuid-1',
      template_id: templateId,
      user_id: auth.id,
      source: TemplateEntitlementSource.FREE_CLAIM,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    };

    claimFreeTemplateHandler.execute.mockResolvedValue(expectedResponse);

    const result = await controller.claim(templateId, auth);

    expect(claimFreeTemplateHandler.execute).toHaveBeenCalledWith(
      new ClaimFreeTemplateCommand(templateId, auth.id),
    );
    expect(result).toEqual(expectedResponse);
  });
});
