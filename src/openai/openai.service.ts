import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { ChatContext } from './chat-context.entity';
import { ChatMessageDto } from './dto/chat-message.dto';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(ChatContext)
    private chatContextRepository: Repository<ChatContext>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async processMessage(userId: number, dto: ChatMessageDto): Promise<string> {
    try {
      // Получаем или создаем контекст чата
      let chatContext = await this.chatContextRepository.findOne({
        where: { userId },
      });

      if (!chatContext) {
        chatContext = this.chatContextRepository.create({
          userId,
          messages: [],
        });
      }

      // Добавляем сообщение пользователя
      chatContext.messages.push({
        role: 'user',
        content: dto.message,
        timestamp: new Date(),
      });

      // Формируем промпт для OpenAI
      const messages = chatContext.messages.map((msg) => ({
        role: msg.role,
        content:
          msg.role === 'user'
            ? `${msg.content} [Отвечай на ${dto.language} языке]`
            : msg.content,
      }));

      // Получаем ответ от OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0].message.content;

      // Сохраняем ответ ассистента
      chatContext.messages.push({
        role: 'assistant',
        content: assistantMessage || '',
        timestamp: new Date(),
      });

      // Сохраняем обновленный контекст
      await this.chatContextRepository.save(chatContext);

      return assistantMessage || '';
    } catch (error: unknown) {
      this.logger.error(
        `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
