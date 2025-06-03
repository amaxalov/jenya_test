import { ChatContext } from '../openai/chat-context.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @OneToMany(() => ChatContext, (chatContext) => chatContext.userId)
  chatContexts: ChatContext[];
}
