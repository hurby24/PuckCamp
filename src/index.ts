import { Hono } from "hono";
import { ApiError } from "./utils";
import httpStatus from "http-status";
import { errorHandler, csrfToken } from "./middlewares";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { defaultRoutes } from "./routes";

const app = new Hono();

app.use(secureHeaders());
app.on(["POST", "PUT", "DELETE"], "/v0/*", csrfToken);
app.use(
	"/v0/*",
	cors({
		origin: "https://puckcamp.net",
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
	}),
);
app.use(prettyJSON());
app.use(logger());

app.notFound(() => {
	throw new ApiError(httpStatus.NOT_FOUND, "Not found");
});

app.onError(errorHandler);

app.get("/", async (c) => {
	return c.text("workin'");
});

defaultRoutes.map((route) => {
	app.route(`${route.path}`, route.route);
});

export default {
	port: process.env.PORT || 3000,
	fetch: app.fetch,
};
