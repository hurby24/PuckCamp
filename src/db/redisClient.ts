import { Redis } from "ioredis";

export const getRedisClient = () => {
  if (process.env.NODE_ENV === "development") {
    return new Redis(process.env.REDIS_URL!, {
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    return new Redis();
  }
};
