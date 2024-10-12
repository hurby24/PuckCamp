import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const getDbConnection = () => {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error("DATABASE_URL is not defined");
	}

	const pool = new Pool({
		connectionString: connectionString,
	});

	return drizzle(pool);
};
