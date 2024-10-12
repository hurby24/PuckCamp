export class ApiError extends Error {
	statusCode: number;
	isOperational: boolean;
	details?: string;

	constructor(
		statusCode: number,
		message: string,
		details?: string,
		isOperational = true,
	) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.details = details;
	}
}
