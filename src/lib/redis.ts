import { createClient } from 'redis';

const redisClientSingleton = () => {
  const url = process.env.REDIS_URL || 'redis://cache:6379';
  console.log(`Connecting to Redis at ${url}`);
  const client = createClient({ url });

  client.on('error', (err) => console.error('Redis Client Error', err));
  
  // The client.connect() is now handled within the functions that use it
  // to ensure it's connected before commands are issued.

  return client;
};

declare global {
  var redis: undefined | ReturnType<typeof redisClientSingleton>
}

const redis = globalThis.redis ?? redisClientSingleton()

export default redis;

if (process.env.NODE_ENV !== 'production') globalThis.redis = redis
