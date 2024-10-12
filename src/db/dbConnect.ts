import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const getDbConnection = () => {
  const connectionString = process.env.DATABASE_URL!;

  const pool = new Pool({
    connectionString: connectionString,
  });

  return drizzle(pool);
};
