import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';
import { Chat } from './chat-context.entity';
import { User } from 'src/users/user.entity';
import { PromptsModule } from 'src/prompts/prompts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User]),
    ConfigModule,
    PromptsModule,
  ],
  controllers: [OpenAIController],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
