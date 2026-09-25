import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';

import type {
  AiRuntimePort,
  AiRuntimeRequest,
  AiRuntimeResult,
} from '../../application/ports/ai-runtime.port';

type WritingAction =
  | 'IMPROVE'
  | 'SHORTEN'
  | 'EXPAND'
  | 'SUMMARIZE'
  | 'TRANSLATE'
  | 'CONTINUE';

interface FastApiWritingRequest {
  action: WritingAction;
  text: string;
  language?: string | null;
}

interface FastApiWritingResponse {
  result: string;
  provider: string;
  model: string;
}

const WRITING_CAPABILITIES: Record<string, WritingAction> = {
  'writing.improve': 'IMPROVE',
  'writing.shorten': 'SHORTEN',
  'writing.expand': 'EXPAND',
  'writing.summarize': 'SUMMARIZE',
  'writing.translate': 'TRANSLATE',
  'writing.continue': 'CONTINUE',
};

@Injectable()
export class FastApiAiRuntimeAdapter implements AiRuntimePort {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async execute(request: AiRuntimeRequest): Promise<AiRuntimeResult> {
    const action = WRITING_CAPABILITIES[request.capability];

    if (!action) {
      throw new BadRequestException(
        `Unsupported AI capability: ${request.capability}`,
      );
    }

    const text = this.getText(request.input);
    const language = this.getOptionalString(request.input, 'language');

    const payload: FastApiWritingRequest = {
      action,
      text,
      language,
    };

    const baseUrl = this.configService.getOrThrow<string>(
      'AI_SERVICE_BASE_URL',
    );

    const internalToken =
      this.configService.getOrThrow<string>('AI_INTERNAL_TOKEN');

    const timeout = Number(
      this.configService.get<string>('AI_SERVICE_TIMEOUT_MS') ?? 65000,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<FastApiWritingResponse>(
          `${baseUrl}/internal/v1/writing`,
          payload,
          {
            timeout,
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Service-Token': internalToken,
            },
          },
        ),
      );

      if (
        !response.data ||
        typeof response.data.result !== 'string' ||
        !response.data.result.trim()
      ) {
        throw new BadGatewayException(
          'AI service returned an invalid response',
        );
      }

      return {
        output: {
          text: response.data.result,
        },
        provider: response.data.provider,
        model: response.data.model,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new GatewayTimeoutException('AI service request timed out');
        }

        if (!error.response) {
          throw new ServiceUnavailableException('AI service is unavailable');
        }

        throw new BadGatewayException(
          `AI service returned HTTP ${error.response.status}`,
        );
      }

      throw error;
    }
  }

  private getText(input: Record<string, unknown>): string {
    if (typeof input.text === 'string' && input.text.trim()) {
      return input.text;
    }

    if (typeof input.message === 'string' && input.message.trim()) {
      return input.message;
    }

    throw new BadRequestException('AI writing input text is required');
  }

  private getOptionalString(
    input: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = input[key];

    if (value === undefined || value === null) {
      return null;
    }

    return typeof value === 'string' ? value : null;
  }
}
