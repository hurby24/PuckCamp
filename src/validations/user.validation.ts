import { z } from "zod";

export const createUser = z
	.object({
		email: z.string().email().max(255),
		username: z.string().min(3).max(25),
		password: z
			.string()
			.min(8)
			.max(255)
			.regex(
				/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
				"Password must contain at least one uppercase letter, one number, and one special character",
			),
		confirmPassword: z.string().max(255),
		"cf-turnstile-response": z.string().max(2048),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});
