import type { ZodError } from "zod";
import { type ErrorMessageOptions, generateErrorMessage } from "zod-error";

const zodErrorOptions: ErrorMessageOptions = {
	delimiter: {
		error: ", \n ",
		component: "",
	},
	path: {
		enabled: true,
		type: "objectNotation",
		transform: ({ label, value }) => `"${label}": "${value}", \n `,
	},
	code: {
		enabled: true,
		transform: ({ label, value }) => `"${label}": "${value}", \n `,
	},
	message: {
		enabled: true,
		transform: ({ label, value }) => `"${label}": "${value}" \n `,
	},
	transform: ({ errorMessage }) => `{ ${errorMessage} }`,
};

export const generateZodErrorMessage = (error: ZodError): string => {
	const err = generateErrorMessage(error.issues, zodErrorOptions);
	const fullError = `[ \n" + ${err} + "] \n`;
	return JSON.parse(fullError);
};
