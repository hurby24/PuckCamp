import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import {
	generateSessionToken,
	createSession,
	validateSessionToken,
	invalidateSession,
	invalidateAllSessions,
	type SessionOptions,
} from "../services/session";
import { getRedisClient } from "../db/redisClient";

let redis: ReturnType<typeof getRedisClient>;
let token: string;
let sessionId: string;
let userId: string;

beforeAll(async () => {
	redis = getRedisClient();
	userId = "123";
});

afterAll(async () => {
	await invalidateAllSessions(userId);
});

describe("Session Service", () => {
	it("should generate a session token", () => {
		token = generateSessionToken();
		expect(token).toBeDefined();
		expect(token.length).toBeGreaterThan(0);
	});

	it("should create a session", async () => {
		const sessionOptions: SessionOptions = {
			emailVerified: true,
			temporary: false,
		};
		const session = await createSession(token, userId, sessionOptions);
		sessionId = session.id;
		expect(session).toBeDefined();
		expect(session.userId).toBe(userId);

		const storedSession = await redis.get(`session:${session.id}`);
		expect(storedSession).toBeDefined();
	});

	it("should validate a valid session token", async () => {
		const session = await validateSessionToken(token);
		expect(session).toBeDefined();
		expect(session?.userId).toBe(userId);
	});

	it("should invalidate a session", async () => {
		await invalidateSession(sessionId, userId);
		const session = await validateSessionToken(token);
		expect(session).toBeNull();
	});

	it("should invalidate all sessions for a user", async () => {
		const newToken = generateSessionToken();
		await createSession(newToken, userId, {
			emailVerified: true,
			temporary: false,
		});
		await invalidateAllSessions(userId);
		const sessionIds = await redis.smembers(`user:${userId}:sessions`);
		expect(sessionIds.length).toBe(0);
	});
});
