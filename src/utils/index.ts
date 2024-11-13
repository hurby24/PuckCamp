import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
export { ApiError } from "./ApiError";
export { generateZodErrorMessage } from "./ZodError";
export { createCsrfToken, validateCsrfToken } from "./csrfToken";

export function generateIdFromEntropySize(size: number): string {
	const buffer = crypto.getRandomValues(new Uint8Array(size));
	return encodeBase32LowerCaseNoPadding(buffer);
}

export async function validateCaptcha(
	token: string,
	ip = "",
): Promise<boolean> {
	if (!process.env.CAPTCHA_SECRET_KEY) {
		throw new Error("CAPTCHA_SECRET_KEY is not set");
	}

	const formData = new FormData();
	formData.append("secret", process.env.CAPTCHA_SECRET_KEY);
	formData.append("response", token);
	formData.append("remoteip", ip);

	const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
	const result = await fetch(url, {
		body: formData,
		method: "POST",
	});

	const outcome = await result.json();
	return outcome.success;
}
