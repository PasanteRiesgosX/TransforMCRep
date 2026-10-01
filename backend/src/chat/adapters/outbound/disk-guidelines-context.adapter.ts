import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GuidelinesContext } from '../../ports/guidelines-context.port';

@Injectable()
export class DiskGuidelinesContextAdapter implements GuidelinesContext, OnModuleInit {
  private readonly logger = new Logger(DiskGuidelinesContextAdapter.name);
  private context = '';

  async onModuleInit(): Promise<void> {
    const contextPath = join(__dirname, '../../resources/lineamientos.md');
    try {
      this.context = await readFile(contextPath, 'utf8');
      this.logger.log('Official chat guidelines loaded into memory.');
    } catch (error) {
      this.logger.error(`Could not load chat guidelines from ${contextPath}`, error);
      throw error;
    }
  }

  getText(): string {
    if (!this.context) {
      throw new Error('Chat guidelines have not been loaded');
    }
    return this.context;
  }
}