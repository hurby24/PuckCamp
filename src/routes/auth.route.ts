import { Hono } from "hono";
import { getConnInfo } from "hono/bun";
import httpStatus from "http-status";
import type { StatusCode } from "hono/utils/http-status";
import { TokenBucket } from "../services/rate-limit";
import { getSignedCookie } from "hono/cookie";
import * as authService from "../services/auth";
import * as userService from "../services/user";
import * as userValidation from "../validations/user.validation";
import {
  ApiError,
  validateCaptcha,
  setCSRFTokenCookie,
  createCsrfToken,
} from "../utils";

const authRoute = new Hono();
const rateLimiter = new TokenBucket("auth", 2, 10);
const longRateLimiter = new TokenBucket("authL", 10, 3600);

authRoute.post("/signup", async (c) => {
  const sessionID = await getSignedCookie(
    c,
    process.env.HMACsecret || "",
    "SID"
  );
  if (sessionID != null) {
    const session = await authService.validateSessionToken(
      sessionID.toString()
    );
    if (session != null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User already logged in");
    }
  }
  const info = getConnInfo(c);

  const limit = await longRateLimiter.consume(
    `signup:${info.remote.address}`,
    2
  );
  if (!limit) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, "Too many requests");
  }
  const bodyParse = await c.req.json();
  const body = await userValidation.createUser.parseAsync(bodyParse);
  const captcha = await validateCaptcha(
    body["cf-turnstile-response"],
    info.remote.address
  );
  if (!captcha) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid captcha");
  }
  const emailAvailable = await userService.checkEmailAvailability(body.email);
  if (!emailAvailable) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already in use");
  }
  const usernameAvailable = await userService.checkUsernameAvailability(
    body.username
  );
  if (!usernameAvailable) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Username already in use");
  }
  const user = await userService.createUser(
    body.email,
    body.username,
    body.password
  );
  const emailVerificationCode = await authService.createEmailVerificationCode(
    user.id,
    user.email
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
    sessionOptions
  );
  await authService.setSessionTokenCookie(c, session.id, session.expiresAt);
  const csrfToken = await createCsrfToken(session.id);
  setCSRFTokenCookie(c, csrfToken, session.expiresAt);

  c.status(httpStatus.NO_CONTENT as StatusCode);
  return c.body(null);
});

authRoute.post("/login", async (c) => {
  const sessionID = await getSignedCookie(
    c,
    process.env.HMACsecret || "",
    "SID"
  );
  if (sessionID != null) {
    const session = await authService.validateSessionToken(
      sessionID.toString()
    );
    if (session != null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "User already logged in");
    }
  }
  const info = getConnInfo(c);
  const limit = await longRateLimiter.consume(
    `login:${info.remote.address}`,
    1
  );
  if (!limit) {
    throw new ApiError(httpStatus.TOO_MANY_REQUESTS, "Too many requests");
  }
  const bodyParse = await c.req.json();
  const body = await userValidation.loginUser.parseAsync(bodyParse);
  const captcha = await validateCaptcha(
    body["cf-turnstile-response"],
    info.remote.address
  );
  if (!captcha) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid captcha");
  }

  const user = await userService.matchUserCredentials(
    body.email,
    body.password
  );
  if (user == null) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }
  const sessionOptions: authService.SessionOptions = {
    emailVerified: user.emailVerified,
    temporary: !user.emailVerified,
  };
  if (!user.emailVerified) {
    const emailVerificationCode = await authService.createEmailVerificationCode(
      user.id,
      user.email
    );
    await authService.sendVerificationEmail(user.email, emailVerificationCode);
  }
  const sessionId = await authService.generateSessionToken();
  const session = await authService.createSession(
    sessionId,
    user.id,
    sessionOptions
  );
  await authService.setSessionTokenCookie(c, session.id, session.expiresAt);
  const csrfToken = await createCsrfToken(session.id);
  setCSRFTokenCookie(c, csrfToken, session.expiresAt);
  c.status(httpStatus.NO_CONTENT as StatusCode);
  return c.body(null);
});

//logout(current or all), verify otp(invalidate all session after succesful), send otp, send forgot password, veryif forgot password(invalidate all session after succesful), reset password
export default authRoute;
