import { getRedisClient } from "../db/redisClient";
import type { Redis, Result, Callback } from "ioredis";

declare module "ioredis" {
	interface RedisCommander<Context> {
		TokenBucket(
			key: string,
			max: number,
			refillIntervalSeconds: number,
			cost: number,
			timestamp: number,
			callback?: Callback<string>,
		): Result<string, Context>;
	}
}

export class TokenBucket {
	private storageKey: string;
	private client: Redis;

	public max: number;
	public refillIntervalSeconds: number;

	constructor(storageKey: string, max: number, refillIntervalSeconds: number) {
		this.client = getRedisClient();
		this.storageKey = storageKey;
		this.max = max;
		this.refillIntervalSeconds = refillIntervalSeconds;
	}

	private async initalizeScript() {
		await this.client.defineCommand("TokenBucket", {
			numberOfKeys: 1,
			lua: `
            local key                   = KEYS[1]
            local max                   = tonumber(ARGV[1])
            local refillIntervalSeconds = tonumber(ARGV[2])
            local cost                  = tonumber(ARGV[3])
            local now                   = tonumber(ARGV[4]) -- Current unix time in seconds
            
            local fields = redis.call("HGETALL", key)
            if #fields == 0 then
                redis.call("HSET", key, "count", max - cost, "refilled_at", now)
                return {1}
            end
            local count = 0
            local refilledAt = 0
            for i = 1, #fields, 2 do
            	if fields[i] == "count" then
                    count = tonumber(fields[i+1])
                elseif fields[i] == "refilled_at" then
                    refilledAt = tonumber(fields[i+1])
                end
            end
            local refill = math.floor((now - refilledAt) / refillIntervalSeconds)
            count = math.min(count + refill, max)
            refilledAt = now
            if count < cost then
                return {0}
            end
            count = count - cost
            redis.call("HSET", key, "count", count, "refilled_at", now)
            return {1}

        `,
		});
	}

	public async consume(key: string, cost: number): Promise<boolean> {
		await this.initalizeScript();
		const result = await this.client.TokenBucket(
			`${this.storageKey}:${key}`,
			this.max,
			this.refillIntervalSeconds,
			cost,
			Math.floor(Date.now() / 1000),
		);
		return Boolean(result[0]);
	}
}
