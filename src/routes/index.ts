import authRoute from "./auth.route";

const base_path = "v0";

export const defaultRoutes = [
	{
		path: `/${base_path}/auth`,
		route: authRoute,
	},
];
