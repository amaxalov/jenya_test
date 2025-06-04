import { IsObject, IsOptional } from 'class-validator';

export class UpdateChatContextDto {
  @IsObject()
  @IsOptional()
  taskContext?: Record<string, any>;
}
