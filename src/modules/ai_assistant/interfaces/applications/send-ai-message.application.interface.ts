import { SendAiMessageDto } from '../../dto/send-ai-message.dto';
import { SendAiMessageResponseDto } from '../../dto/response/send-ai-message.response.dto';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';

export interface SendAiMessageApplication {
  send(input: {
    conversationId: string;
    userId: string;
    systemRole: SystemRole;
    dto: SendAiMessageDto;
  }): Promise<SendAiMessageResponseDto>;
}
