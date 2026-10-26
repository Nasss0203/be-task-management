export type MailMessage = {
  to: string;
  from: string;
  subject: string;
  text?: string;
  template: string;
  context?: Record<string, unknown>;
};

export interface MailSender {
  sendMail(message: MailMessage): Promise<void>;
}
