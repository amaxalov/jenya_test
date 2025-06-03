import { Controller, Post, Body, Request } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { AccessTokenPayload } from 'src/auth/types/access-token-payload';
import { FastifyRequest } from 'fastify';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post('chat')
  async chat(
    @Request() req: FastifyRequest & { user: AccessTokenPayload },
    @Body() chatMessageDto: ChatMessageDto,
  ): Promise<{ response: string }> {
    console.log(req.user);
    const response = await this.openAIService.processMessage(
      123,
      chatMessageDto,
    );
    return { response };
  }
}
