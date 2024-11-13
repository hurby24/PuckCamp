import { Hono } from "hono";

const authRoute = new Hono();

authRoute.get("/login", async (c) => {
	return c.text("Login route");
});

export default authRoute;
