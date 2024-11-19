import { getDbConnection } from "../db/dbConnect";
import { users } from "../db/schema";
import { generateNanoId, ApiError } from "../utils";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

export const checkEmailAvailability = async (email: string) => {
	const user = await getDbConnection()
		.select()
		.from(users)
		.where(eq(users.email, email));
	if (user.length === 0) {
		return true;
	}
	return false;
};

export const checkUsernameAvailability = async (username: string) => {
	const user = await getDbConnection()
		.select()
		.from(users)
		.where(eq(users.username, username));
	if (user.length === 0) {
		return true;
	}
	return false;
};

export const createUser = async (
	email: string,
	username: string,
	password: string,
): Promise<User> => {
	const passwordHash = await hashPassword(password);
	const userId = generateNanoId(15);

	try {
		const user = await getDbConnection()
			.insert(users)
			.values({
				id: userId,
				email,
				username,
				password_hash: passwordHash,
				avatar_url: `https://ui-avatars.com/api/?name=${username}&size=300&bold=true&background=random`,
				university_id: 0,
				updated_at: new Date(),
			})
			.returning();

		if (user.length === 0) {
			throw new ApiError(500, "Failed to create user");
		}
	} catch (error) {
		throw new ApiError(500, "Failed to create user");
	}

	const userResponse: User = {
		id: userId,
		email,
		username,
		emailVerified: false,
	};
	return userResponse;
};
export interface User {
	id: string;
	email: string;
	username: string;
	emailVerified: boolean;
}
