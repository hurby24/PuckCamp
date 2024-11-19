async function sendEmail(
	to: string,
	subject: string,
	body: string,
): Promise<void> {
	await fetch("https://api.useplunk.com/v1/send", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
		},
		body: JSON.stringify({
			to: to,
			subject: subject,
			body: body,
		}),
	});
}

export async function sendVerificationEmail(
	email: string,
	code: string,
): Promise<void> {
	const subject = "Verify your email address";
	const body = `Your verification code is: ${code}`;
	await sendEmail(email, subject, body);
}

export async function sendPasswordResetEmail(
	email: string,
	code: string,
): Promise<void> {}
