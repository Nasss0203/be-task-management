import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';

describe('MailController', () => {
  let controller: MailController;

  const mockMailService = {
    templateInviteMember: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendEmailInviteMember', () => {
    it('should call templateInviteMember on service', async () => {
      await controller.sendEmailInviteMember();
      expect(mockMailService.templateInviteMember).toHaveBeenCalledTimes(1);
    });
  });
});
