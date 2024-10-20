import { Redis } from "ioredis";

export const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    if (!redisUrl) {
      throw new Error("REDIS_URL is not defined in development environment");
    }

    return new Redis(redisUrl, {
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return new Redis({
    host: "puck-redis",
    port: 6379,
  });
};
