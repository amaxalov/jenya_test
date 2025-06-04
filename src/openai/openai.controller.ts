import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { UpdateChatContextDto } from './dto/update-chat-context.dto';
import { User } from '../decorators/user.decorator';

@Controller('chats')
export class OpenAIController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post()
  async createChat(@User('sub') userId: number) {
    return this.openAIService.createChat(userId);
  }

  @Get()
  async getUserChats(@User('sub') userId: number) {
    return this.openAIService.getUserChats(userId);
  }

  @Post(':chatId/messages')
  async processMessage(
    @User('sub') userId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() chatMessageDto: ChatMessageDto,
  ) {
    return this.openAIService.processMessage(userId, chatId, chatMessageDto);
  }

  @Put(':chatId/context')
  async updateChatContext(
    @User('sub') userId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() updateChatContextDto: UpdateChatContextDto,
  ) {
    return this.openAIService.updateChatContext(
      chatId,
      userId,
      updateChatContextDto.taskContext,
    );
  }
}
