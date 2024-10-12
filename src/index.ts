import { Hono } from "hono";
import { ApiError } from "./utils";
import httpStatus from "http-status";
import { errorHandler } from "./middlewares";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.notFound(() => {
  throw new ApiError(httpStatus.NOT_FOUND, "Not found");
});

app.onError(errorHandler);

app.get("/", async (c) => {
  return c.text("Hello Hono!");
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
