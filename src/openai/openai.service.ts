import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { Chat } from './chat-context.entity';
import { ChatMessageDto } from './dto/chat-message.dto';
import { PromptsService } from '../prompts/prompts.service';
import { User } from 'src/users/user.entity';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private promptsService: PromptsService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async processMessage(
    userId: number,
    chatId: number,
    dto: ChatMessageDto,
  ): Promise<string> {
    try {
      // Получаем чат
      const chat = await this.chatRepository.findOne({
        where: { id: chatId, userId },
      });

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      if (!user) {
        throw new Error('User not found');
      }

      // Добавляем сообщение пользователя
      chat.messages.push({
        role: 'user',
        content: dto.message,
        timestamp: new Date(),
      });

      const prompt = this.promptsService.getPrompt(
        chat.taskContext?.promptName || 'default',
      );

      console.log(prompt);

      if (!prompt) {
        throw new Error('Prompt not found');
      }

      const messages = this.prepareMessages(chat, prompt, user);

      // Получаем ответ от OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0].message.content;

      // Сохраняем ответ ассистента
      chat.messages.push({
        role: 'assistant',
        content: assistantMessage || '',
        timestamp: new Date(),
      });

      // Сохраняем обновленный чат
      await this.chatRepository.save(chat);

      return assistantMessage || '';
    } catch (error: unknown) {
      this.logger.error(
        `Error processing message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private prepareMessages(
    chat: Chat,
    prompt: { name: string },
    user: User,
  ): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [];

    // Добавляем системное сообщение с контекстами
    if (user.userContext || chat.taskContext) {
      const systemContext: ChatCompletionMessageParam = {
        role: 'system',
        content: JSON.stringify({
          userContext: user.userContext,
          taskContext: chat.taskContext,
        }),
      };
      messages.push(systemContext);
    }

    // Добавляем промпт
    const renderedPrompt: ChatCompletionMessageParam[] =
      this.promptsService.renderPrompt(
        prompt.name,
        Object.fromEntries(
          Object.entries(chat.taskContext || {}).map(([k, v]) => [
            k,
            JSON.stringify(v),
          ]),
        ),
      ) as ChatCompletionMessageParam[];

    messages.push(...renderedPrompt);

    // Добавляем историю сообщений
    const chatMessages = chat.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    return [...messages, ...chatMessages];
  }

  async createChat(userId: number): Promise<Chat> {
    const chat = this.chatRepository.create({
      userId,
      messages: [],
    });
    return this.chatRepository.save(chat);
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return this.chatRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async updateChatContext(
    chatId: number,
    userId: number,
    taskContext?: Record<string, any>,
  ): Promise<Chat> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (taskContext) {
      chat.taskContext = { ...chat.taskContext, ...taskContext };
    }

    return this.chatRepository.save(chat);
  }
}
