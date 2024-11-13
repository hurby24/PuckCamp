import { createMiddleware } from "hono/factory";
import { ApiError } from "../utils/ApiError";
import { setCookie, getSignedCookie } from "hono/cookie";
import httpStatus from "http-status";
import { createCsrfToken, validateCsrfToken } from "../utils";

const csrfToken = createMiddleware(async (c, next) => {
	const sessionID = await getSignedCookie(c, c.env.HMACsecret, "SID");
	const csrfToken = c.req.header("X-CSRF-Token");
	if (sessionID != null) {
		if (csrfToken == null) {
			const newcsrfToken = await createCsrfToken(sessionID.toString());

			setCookie(c, "csrftoken", newcsrfToken, {
				path: "/",
				secure: true,
				sameSite: "Lax",
			});
			throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
		}
		const validToken = await validateCsrfToken(sessionID.toString(), csrfToken);
		if (!validToken) {
			const newcsrfToken = await createCsrfToken(sessionID.toString());

			setCookie(c, "csrftoken", newcsrfToken, {
				path: "/",
				secure: true,
				sameSite: "Lax",
			});
			throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
		}
	}
	await next();
});

export default csrfToken;
