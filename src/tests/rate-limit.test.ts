import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { TokenBucket } from "../services/rate-limit";
import { getRedisClient } from "../db/redisClient";
import type { Redis } from "ioredis";

describe("TokenBucket", () => {
	let redisClient: Redis;
	let tokenBucket: TokenBucket;

	beforeAll(() => {
		redisClient = getRedisClient();
		tokenBucket = new TokenBucket("test_bucket", 5, 2);
	});

	afterAll(async () => {
		await redisClient.flushdb();
		await redisClient.quit();
	});

	it("should allow consuming tokens when the bucket has enough tokens", async () => {
		const result = await tokenBucket.consume("user1", 1);
		expect(result).toBe(true);
	});

	it("should prevent consuming tokens when the bucket is empty", async () => {
		for (let i = 0; i < 5; i++) {
			await tokenBucket.consume("user2", 1);
		}

		const result = await tokenBucket.consume("user2", 1);
		expect(result).toBe(false);
	});

	it("should refill tokens after the interval", async () => {
		for (let i = 0; i < 5; i++) {
			await tokenBucket.consume("user3", 1);
		}

		const resultBeforeRefill = await tokenBucket.consume("user3", 1);
		expect(resultBeforeRefill).toBe(false);

		await new Promise((resolve) => setTimeout(resolve, 2000));

		const resultAfterRefill = await tokenBucket.consume("user3", 1);
		expect(resultAfterRefill).toBe(true);
	});

	it("should handle concurrent token consumption correctly", async () => {
		const promises = [];
		for (let i = 0; i < 10; i++) {
			promises.push(tokenBucket.consume("user4", 1));
		}

		const results = await Promise.all(promises);
		const successCount = results.filter((result) => result).length;

		expect(successCount).toBe(5);
	});
});
