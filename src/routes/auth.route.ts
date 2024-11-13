import { Hono } from "hono";
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
import * as authValidation from "../validations/user.validation";

const authRoute = new Hono();

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
  //todo, validate request body, validate captcha, check user exists, create user, create session, return session token
  // const bodyParse = await c.req.json();
  return c.text("Login route");
});

export default authRoute;
