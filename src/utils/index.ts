import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";
export { ApiError } from "./ApiError";
export { generateZodErrorMessage } from "./ZodError";

export function generateIdFromEntropySize(size: number): string {
	const buffer = crypto.getRandomValues(new Uint8Array(size));
	return encodeBase32LowerCaseNoPadding(buffer);
}
