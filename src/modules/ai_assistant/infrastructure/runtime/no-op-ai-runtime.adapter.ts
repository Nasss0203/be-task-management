import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  AiRuntimePort,
  AiRuntimeResult,
} from '../../application/ports/ai-runtime.port';

@Injectable()
export class NoOpAiRuntimeAdapter implements AiRuntimePort {
  execute(): Promise<AiRuntimeResult> {
    throw new ServiceUnavailableException(
      'AI runtime is not configured for this environment',
    );
  }
}
