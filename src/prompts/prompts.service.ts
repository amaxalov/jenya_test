import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface PromptTemplate {
  name: string;
  description: string;
  category: string;
  template: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);
  private prompts: Map<string, PromptTemplate> = new Map();

  constructor() {
    void this.loadPrompts();
  }

  private async loadPrompts() {
    try {
      const promptsDir = path.join(
        process.cwd(),
        'src',
        'prompts',
        'templates',
      );
      const files = await fs.readdir(promptsDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(promptsDir, file),
            'utf-8',
          );
          const prompt = JSON.parse(content) as PromptTemplate;
          this.prompts.set(prompt.name, prompt);
        }
      }

      this.logger.log(`Loaded ${this.prompts.size} prompts`);
    } catch (error) {
      this.logger.error('Failed to load prompts', error);
    }
  }

  getPrompt(name: string): PromptTemplate | undefined {
    return this.prompts.get(name);
  }

  getAllPrompts(): PromptTemplate[] {
    return Array.from(this.prompts.values());
  }

  getPromptsByCategory(category: string): PromptTemplate[] {
    return this.getAllPrompts().filter((p) => p.category === category);
  }

  renderPrompt(
    name: string,
    variables: Record<string, string> = {},
  ): { role: string; content: string }[] {
    const prompt = this.getPrompt(name);
    if (!prompt) {
      throw new Error(`Prompt "${name}" not found`);
    }

    return prompt.template.map((template) => {
      let content = template.content;

      // Заменяем переменные в шаблоне
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return {
        role: template.role,
        content,
      };
    });
  }
}
