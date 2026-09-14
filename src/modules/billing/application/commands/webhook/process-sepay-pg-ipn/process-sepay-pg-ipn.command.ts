import type { SepayPgIpnRequestDto } from '../../../dto/request/sepay-pg-ipn.request.dto';

export class ProcessSepayPgIpnCommand {
  constructor(public readonly payload: Readonly<SepayPgIpnRequestDto>) {}
}
