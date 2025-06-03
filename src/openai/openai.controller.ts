import { Controller, Post, Body, Request } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post('chat')
  async chat(
    @Request() req,
    @Body() chatMessageDto: ChatMessageDto,
  ): Promise<{ response: string }> {
    const response = await this.openAIService.processMessage(
      req.user.id,
      chatMessageDto,
    );
    return { response };
  }
}
