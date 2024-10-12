import type { ErrorHandler } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import httpStatus from "http-status";
import { ZodError } from "zod";
import { ApiError, generateZodErrorMessage } from "../utils";

const errorConverter = (err: unknown): ApiError => {
	if (err instanceof ApiError) return err;

	if (err instanceof ZodError) {
		const errorMessage = generateZodErrorMessage(err);
		return new ApiError(
			httpStatus.UNPROCESSABLE_ENTITY,
			"Validation failed",
			errorMessage,
		);
	}

	if (
		err instanceof SyntaxError &&
		err.message.includes("Unexpected end of JSON input")
	) {
		return new ApiError(httpStatus.BAD_REQUEST, "Invalid JSON payload");
	}

	const castedErr = (err && typeof err === "object" ? err : {}) as Record<
		string,
		unknown
	>;
	const statusCode =
		typeof castedErr.statusCode === "number"
			? castedErr.statusCode
			: httpStatus.INTERNAL_SERVER_ERROR;
	const message =
		(castedErr.message as string) ||
		httpStatus[statusCode as keyof typeof httpStatus];

	return new ApiError(statusCode, String(message));
};

export const errorHandler: ErrorHandler = async (err, c) => {
	const error = errorConverter(err);
	if (!error.isOperational) {
		error.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
		error.message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR] as string;
	}

	const response = {
		code: error.statusCode,
		message: error.message,
		details: error.details,
	};

	return c.json(response, error.statusCode as StatusCode);
};
