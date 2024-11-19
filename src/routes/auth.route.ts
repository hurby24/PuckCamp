import { Hono } from "hono";
import { getConnInfo } from "hono/bun";
import httpStatus from "http-status";
import type { StatusCode } from "hono/utils/http-status";
import { ApiError, validateCaptcha } from "../utils";
import {
	setSignedCookie,
	getSignedCookie,
	setCookie,
	getCookie,
} from "hono/cookie";
import * as authService from "../services/auth";
import * as userService from "../services/user";
import * as userValidation from "../validations/user.validation";

const authRoute = new Hono();

authRoute.post("/signup", async (c) => {
	const sessionID = await getSignedCookie(
		c,
		process.env.HMACsecret || "",
		"SID",
	);
	if (sessionID != null) {
		const session = await authService.validateSessionToken(
			sessionID.toString(),
		);
		if (session != null) {
			throw new ApiError(httpStatus.BAD_REQUEST, "User already logged in");
		}
	}
	const bodyParse = await c.req.json();
	const body = await userValidation.createUser.parseAsync(bodyParse);
	const info = getConnInfo(c);
	const captcha = await validateCaptcha(
		body["cf-turnstile-response"],
		info.remote.address,
	);
	if (!captcha) {
		throw new ApiError(httpStatus.BAD_REQUEST, "Invalid captcha");
	}
	const emailAvailable = await userService.checkEmailAvailability(body.email);
	if (!emailAvailable) {
		throw new ApiError(httpStatus.BAD_REQUEST, "Email already in use");
	}
	const usernameAvailable = await userService.checkUsernameAvailability(
		body.username,
	);
	if (!usernameAvailable) {
		throw new ApiError(httpStatus.BAD_REQUEST, "Username already in use");
	}
	const user = await userService.createUser(
		body.email,
		body.username,
		body.password,
	);
	const emailVerificationCode = await authService.createEmailVerificationCode(
		user.id,
		user.email,
	);
	await authService.sendVerificationEmail(user.email, emailVerificationCode);
	const sessionOptions: authService.SessionOptions = {
		emailVerified: false,
		temporary: true,
	};
	const sessionId = await authService.generateSessionToken();
	const session = await authService.createSession(
		sessionId,
		user.id,
		sessionOptions,
	);
	await authService.setSessionTokenCookie(c, session.id, session.expiresAt);
	c.status(httpStatus.NO_CONTENT as StatusCode);
	return c.body(null);
});

export default authRoute;
