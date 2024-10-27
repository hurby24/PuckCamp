import { describe, expect, it, beforeAll } from "bun:test";
import {
	hashPassword,
	verifyPasswordHash,
	validatePasswordResetToken,
	createPasswordResetToken,
} from "../services/auth/password";

describe("Password hash Service", () => {
	let password: string;
	let hash: string;

	beforeAll(() => {
		password = "password123";
	});

	it("should hash a password", async () => {
		hash = await hashPassword(password);
		expect(hash).toBeDefined();
		expect(hash.length).toBeGreaterThan(0);
	});

	it("should verify a valid password hash", async () => {
		const isValid = await verifyPasswordHash(hash, password);
		expect(isValid).toBe(true);
	});

	it("should not verify an invalid password hash", async () => {
		const isValid = await verifyPasswordHash(hash, "wrongpassword");
		expect(isValid).toBe(false);
	});
});

describe("Password Reset Service", () => {
	let userId: string;
	let token: string;

	beforeAll(() => {
		userId = "123";
	});

	it("should create a password reset token", async () => {
		token = await createPasswordResetToken(userId);
		expect(token).toBeDefined();
		expect(token.length).toBeGreaterThan(0);
	});

	it("should validate a valid password reset token", async () => {
		const validUserId = await validatePasswordResetToken(token);
		expect(validUserId).toBe(userId);
	});

	it("should not validate an invalid password reset token", async () => {
		const validUserId = await validatePasswordResetToken("invalidtoken");
		expect(validUserId).toBeNull();
	});
});
