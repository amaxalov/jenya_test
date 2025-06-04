import { Chat } from '../openai/chat-context.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @OneToMany(() => Chat, (chat) => chat.userId)
  chats: Chat[];

  @Column('jsonb', { nullable: true })
  userContext: {
    preferences?: Record<string, any>;
    settings?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}
