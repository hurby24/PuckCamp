import { describe, expect, it, beforeAll } from "bun:test";
import {
	createEmailVerificationCode,
	validateEmailVerificationCode,
} from "../services/auth/email-verification";

describe("Email Verification Service", () => {
	let userId: string;
	let email: string;
	let code: string;

	beforeAll(() => {
		userId = "123";
		email = "exampleuser@example.com";
	});

	it("should create an email verification code", async () => {
		code = await createEmailVerificationCode(userId, email);
		expect(code).toBeDefined();
		expect(code.length).toBe(7);
	});

	it("should validate a valid email verification code", async () => {
		const isValid = await validateEmailVerificationCode(userId, email, code);
		expect(isValid).toBe(true);
	});

	it("should not validate an invalid email verification code", async () => {
		const isValid = await validateEmailVerificationCode(
			userId,
			email,
			"invalidcode",
		);
		expect(isValid).toBe(false);
	});
});
