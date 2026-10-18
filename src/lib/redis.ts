import { Redis } from "ioredis";

// Redis only accelerates reads; MongoDB remains the source of truth.
// Do not require a cache or open a network connection during Next.js builds.
export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { lazyConnect: true })
  : null;
