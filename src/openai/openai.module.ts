import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';
import { ChatContext } from './chat-context.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatContext]), ConfigModule],
  controllers: [OpenAIController],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
