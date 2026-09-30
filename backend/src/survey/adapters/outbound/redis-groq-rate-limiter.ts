import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import { AiCallRateLimiter } from '../../ports/ai-call-rate-limiter.port';

const consumePermitScript = `
local key = KEYS[1]
local redisTime = redis.call('TIME')
local now = tonumber(redisTime[1]) * 1000 + math.floor(tonumber(redisTime[2]) / 1000)
local windowMs = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local member = ARGV[3]
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)
local count = redis.call('ZCARD', key)
if count < limit then
  redis.call('ZADD', key, now, member)
  redis.call('PEXPIRE', key, windowMs)
  return {1, 0}
end
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
return {0, tonumber(oldest[2]) + windowMs - now}
`;

@Injectable()
export class RedisGroqRateLimiter implements AiCallRateLimiter, OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });
  }

  async waitForPermit(): Promise<void> {
    while (true) {
      const [allowed, waitMs] = await this.redis.eval(
        consumePermitScript,
        1,
        'survey:groq:requests',
        60_000,
        20,
        randomUUID(),
      ) as [number, number];

      if (allowed === 1) return;
      await new Promise(resolve => setTimeout(resolve, Math.max(waitMs, 1) + 10));
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}