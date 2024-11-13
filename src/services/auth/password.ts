import { getDbConnection } from "../../db/dbConnect";
import { password_reset_tokens } from "../../db/schema";
import { generateIdFromEntropySize } from "../../utils";
import { eq } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
	return await Bun.password.hash(password, {
		algorithm: "argon2id",
		memoryCost: 19456,
		timeCost: 3,
	});
}

export async function verifyPasswordHash(
	hash: string,
	password: string,
): Promise<boolean> {
	let isValid = false;
	try {
		isValid = await Bun.password.verify(password, hash);
	} catch (e) {
		return false;
	}
	return isValid;
}

export async function createPasswordResetToken(
	userId: string,
): Promise<string> {
	const tokenId = generateIdFromEntropySize(25);
	const hasher = new Bun.CryptoHasher("sha256");
	const tokenHash = hasher
		.update(new TextEncoder().encode(tokenId))
		.digest("hex");
	await getDbConnection().transaction(async (trx) => {
		await trx
			.delete(password_reset_tokens)
			.where(eq(password_reset_tokens.user_id, userId));
		await trx.insert(password_reset_tokens).values({
			user_id: userId,
			token_hash: tokenHash,
			expires_at: new Date(Date.now() + 1000 * 60 * 60 * 1),
		});
	});
	return tokenId;
}

export async function validatePasswordResetToken(
	token: string,
): Promise<string | null> {
	const hasher = new Bun.CryptoHasher("sha256");
	const tokenHash = hasher
		.update(new TextEncoder().encode(token))
		.digest("hex");
	const tokenRecord = await getDbConnection()
		.select()
		.from(password_reset_tokens)
		.where(eq(password_reset_tokens.token_hash, tokenHash));
	if (tokenRecord.length === 0) {
		return null;
	}
	if (tokenRecord[0].expires_at <= new Date()) {
		await getDbConnection()
			.delete(password_reset_tokens)
			.where(eq(password_reset_tokens.token_hash, tokenHash));
		return null;
	}
	return tokenRecord[0].user_id;
}
