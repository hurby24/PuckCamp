import { Hono } from "hono";
import { ApiError } from "./utils";
import httpStatus from "http-status";
import { errorHandler } from "./middlewares";
import { logger } from "hono/logger";
import { getRedisClient } from "./db/redisClient";
import { getDbConnection } from "./db/dbConnect";

const app = new Hono();

app.use(logger());
app.notFound(() => {
  throw new ApiError(httpStatus.NOT_FOUND, "Not found");
});

app.onError(errorHandler);

app.get("/", async (c) => {
  const envVar = process.env.NODE_ENV + " " + process.env.DATABASE_URL;
  return c.text(envVar);
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
