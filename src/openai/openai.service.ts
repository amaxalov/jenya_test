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
      console.log('processMessage', userId, chatId, dto);
      const chat = await this.chatRepository.findOne({
        where: { id: chatId, userId },
      });
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!chat) throw new Error('Chat not found');
      if (!user) throw new Error('User not found');

      chat.messages.push({
        role: 'user',
        content: dto.message,
        timestamp: new Date(),
      });

      console.log('chat', chat);

      // --- Многошаговый flow ---
      switch (chat.step) {
        case undefined:
        case 'initial': {
          const prompt = this.promptsService.getPrompt('default');
          if (!prompt) throw new Error('Prompt not found');
          console.log('prompt', prompt);
          const messages = this.prepareMessages(chat, prompt, user);
          console.log('messages', messages);
          const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
          });
          console.log('response', response.choices[0].message.content);
          const promptName = this.detectPromptFromResponse(
            response.choices[0].message.content || '',
          );
          chat.taskContext = { ...chat.taskContext, promptName };
          chat.step = 'collecting';
          chat.collectedData = {};
          await this.chatRepository.save(chat);
          return this.getNextQuestion(promptName, chat.collectedData || {});
        }
        case 'collecting': {
          this.saveAnswerToCollectedData(chat, dto.message);
          if (
            this.isAllDataCollected(
              chat.taskContext?.promptName || '',
              chat.collectedData || {},
            )
          ) {
            console.log('allDataCollected', chat);
            chat.step = 'final';
            await this.chatRepository.save(chat);
            // Сразу запускаем финальный промпт
            const finalPrompt = this.promptsService.getPrompt('final');
            if (!finalPrompt) throw new Error('Final prompt not found');
            console.log('finalPrompt', finalPrompt);
            const finalMessages = this.prepareFinalMessages(chat, finalPrompt);
            console.log('finalMessages', finalMessages);
            const response = await this.openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: finalMessages,
              temperature: 0.7,
            });
            const cron = response.choices[0].message.content || '';
            chat.messages.push({
              role: 'assistant',
              content: cron,
              timestamp: new Date(),
            });
            chat.step = 'done';
            await this.chatRepository.save(chat);
            return cron;
          } else {
            console.log('notAllDataCollected', chat);
            await this.chatRepository.save(chat);
            return this.getNextQuestion(
              chat.taskContext?.promptName || '',
              chat.collectedData || {},
            );
          }
        }
        case 'final': {
          console.log('final', chat);
          const finalPrompt = this.promptsService.getPrompt('final');
          if (!finalPrompt) throw new Error('Final prompt not found');
          console.log('finalPrompt', finalPrompt);
          const finalMessages = this.prepareFinalMessages(chat, finalPrompt);
          console.log('finalMessages', finalMessages);
          const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: finalMessages,
            temperature: 0.7,
          });
          const cron = response.choices[0].message.content || '';
          chat.messages.push({
            role: 'assistant',
            content: cron,
            timestamp: new Date(),
          });
          chat.step = 'done';
          await this.chatRepository.save(chat);
          return cron;
        }
        case 'done': {
          return 'Задача уже создана. Начните новый чат для новой задачи.';
        }
      }
      return '';
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

    // Добавляем системное сообщение с контекстами (если нужно)
    if (user.userContext || chat.taskContext) {
      messages.push({
        role: 'system',
        content: JSON.stringify({
          userContext: user.userContext,
          taskContext: chat.taskContext,
        }),
      });
    }

    // Если это первый шаг (default), то:
    if (prompt.name === 'default') {
      // system-инструкция из промпта
      const promptTemplate = this.promptsService.getPrompt(prompt.name);
      if (promptTemplate) {
        promptTemplate.template.forEach((template) => {
          messages.push({
            role: template.role,
            content: template.content,
          });
        });
      }
      // последнее сообщение пользователя
      if (chat.messages.length > 0) {
        const lastUserMessage = chat.messages[chat.messages.length - 1];
        messages.push({
          role: 'user',
          content: lastUserMessage.content,
        });
      }
      return messages;
    }

    // Для остальных шагов — только история чата
    return chat.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
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

  private detectPromptFromResponse(response: string): string {
    if (response.toLowerCase().includes('training')) return 'training';
    return 'unknown';
  }

  private getNextQuestion(
    promptName: string,
    collectedData: Record<string, any>,
  ): string {
    if (promptName === 'training') {
      if (!collectedData.goal) return 'Какая у вас цель тренировки?';
      if (!collectedData.program) return 'Какая у вас программа тренировок?';
      if (!collectedData.exercises) return 'Какие упражнения вы выполняете?';
    }
    return 'Спасибо, вся информация собрана.';
  }

  private saveAnswerToCollectedData(chat: Chat, answer: string) {
    if (!chat.collectedData) chat.collectedData = {};
    if (!chat.collectedData.goal) chat.collectedData.goal = answer;
    else if (!chat.collectedData.program) chat.collectedData.program = answer;
    else if (!chat.collectedData.exercises)
      chat.collectedData.exercises = answer;
  }

  private isAllDataCollected(
    promptName: string,
    collectedData: Record<string, any>,
  ): boolean {
    if (promptName === 'training') {
      return Boolean(
        collectedData.goal && collectedData.program && collectedData.exercises,
      );
    }
    return true;
  }

  private prepareFinalMessages(
    chat: Chat,
    prompt: { name: string },
  ): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [];

    // system-инструкция из промпта
    const promptTemplate = this.promptsService.getPrompt(prompt.name);
    if (promptTemplate) {
      promptTemplate.template.forEach((template) => {
        messages.push({
          role: template.role,
          content: template.content,
        });
      });
    }

    // Добавляем собранные данные отдельным system-сообщением
    if (chat.collectedData) {
      messages.push({
        role: 'system',
        content: `Собранные данные: ${JSON.stringify(chat.collectedData)}`,
      });
    }

    // Можно добавить всю историю чата, если нужно
    const chatMessages = chat.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    messages.push(...chatMessages);

    return messages;
  }
}
