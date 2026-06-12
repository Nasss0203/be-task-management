import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  
  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailTemplates', () => {
    it('should send email with given input', async () => {
      process.env.MAIL_USER = 'test@example.com';
      
      await service.sendEmailTemplates({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        template: 'test-template',
        context: { key: 'value' },
      });

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: 'recipient@example.com',
        from: '"Nass" <test@example.com>',
        subject: 'Test Subject',
        template: 'test-template',
        context: { key: 'value' },
      });
    });

    it('should use provided from address', async () => {
      await service.sendEmailTemplates({
        to: 'recipient@example.com',
        from: 'custom@example.com',
        subject: 'Test Subject',
        template: 'test-template',
      });

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'custom@example.com',
      }));
    });
  });

  describe('sendInviteMember', () => {
    it('should call sendEmailTemplates with correct arguments', async () => {
      const sendSpy = jest.spyOn(service, 'sendEmailTemplates').mockResolvedValue();
      const currentYear = new Date().getFullYear();

      await service.sendInviteMember({
        to: 'invitee@example.com',
        workspaceName: 'My Workspace',
        inviterName: 'John',
        roleName: 'MEMBER',
        acceptUrl: 'http://accept.com',
      });

      expect(sendSpy).toHaveBeenCalledWith({
        to: 'invitee@example.com',
        subject: 'Lời mời tham gia workspace',
        template: 'invite-member',
        context: {
          recipientName: 'invitee@example.com',
          workspaceName: 'My Workspace',
          inviterName: 'John',
          roleName: 'MEMBER',
          acceptUrl: 'http://accept.com',
          expiredAt: '7 ngày kể từ lúc nhận email',
          year: currentYear,
          appName: 'Task Management',
        },
      });
    });
  });

  describe('templateInviteMember', () => {
    it('should call sendEmailTemplates with default test data', async () => {
      const sendSpy = jest.spyOn(service, 'sendEmailTemplates').mockResolvedValue();
      const currentYear = new Date().getFullYear();

      await service.templateInviteMember();

      expect(sendSpy).toHaveBeenCalledWith({
        to: 'anhnamnguyen0203@gmail.com',
        subject: 'Test',
        template: 'invite-member',
        context: {
          recipientName: 'Anh Nam',
          workspaceName: 'Task Management',
          inviterName: 'Nass',
          roleName: 'MEMBER',
          acceptUrl: 'http://localhost:3000/invite/accept?token=test-token',
          expiredAt: '7 ngày kể từ lúc nhận email',
          year: currentYear,
          appName: 'Task Management',
        },
      });
    });
  });
});
