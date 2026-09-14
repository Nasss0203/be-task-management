import type { SePayWebhookRequestDto } from '../../../dto/request/sepay-webhook.request.dto';

export class ProcessSepayWebhookCommand {
  constructor(public readonly payload: Readonly<SePayWebhookRequestDto>) {}
}
