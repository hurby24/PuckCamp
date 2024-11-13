import { getDbConnection } from "../../db/dbConnect";
import { email_verification_codes } from "../../db/schema";
import { generateIdFromEntropySize } from "../../utils";
import { eq, sql } from "drizzle-orm";

export async function createEmailVerificationCode(
	userId: string,
	email: string,
): Promise<string> {
	const code = generateIdFromEntropySize(4);
	const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

	await getDbConnection().transaction(async (trx) => {
		await trx
			.delete(email_verification_codes)
			.where(eq(email_verification_codes.user_id, userId));
		await trx.insert(email_verification_codes).values({
			user_id: userId,
			email,
			code,
			expires_at: expiresAt,
		});
	});

	return code;
}

export async function validateEmailVerificationCode(
	userId: string,
	email: string,
	code: string,
): Promise<boolean> {
	const result = await getDbConnection().transaction(async (trx) => {
		const databaseCode = await trx
			.update(email_verification_codes)
			.set({
				attempts_remaining: sql`${email_verification_codes.attempts_remaining} - 1`,
			})
			.where(eq(email_verification_codes.user_id, userId))
			.returning();

		if (databaseCode.length === 0 || databaseCode[0].code !== code) {
			return false;
		}
		if (
			databaseCode[0].expires_at < new Date() ||
			databaseCode[0].attempts_remaining <= 0
		) {
			await trx
				.delete(email_verification_codes)
				.where(eq(email_verification_codes.user_id, userId));
			return false;
		}
		if (databaseCode[0].email !== email) {
			return false;
		}

		return true;
	});
	return result;
}
